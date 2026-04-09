import { describe, it, expect, vi } from 'vitest'
import { preParse, extractCapacity, inferIndoorOutdoor, inferUnit, sourceHash } from '@/server/ingestion/pre-parse'
import { enrichProduct } from '@/server/ingestion/enrich'
import { buildRetrievalText } from '@/server/ingestion/retrieval-text'
import type { SeedProduct, EnrichedProduct } from '@/schemas'

const mockSeed: SeedProduct = {
  title: 'Grand Ballroom Meridian',
  description: 'Grand ballroom with stage, ceiling-mounted screens. Accommodates up to 180 guests for seated dinner or 250 standing.',
  price_cents: 180000,
  currency: 'EUR',
  category: 'venue',
  subtype: 'ballroom',
}

describe('extractCapacity', () => {
  it('extracts "up to N guests"', () => {
    const r = extractCapacity('Serves up to 150 guests.')
    expect(r.max).toBe(150)
  })

  it('extracts "N seated / M standing" — takes max', () => {
    const r = extractCapacity('Accommodates up to 180 guests for seated dinner or 250 standing.')
    expect(r.max).toBe(250)
  })

  it('extracts "seats up to N"', () => {
    const r = extractCapacity('Seats up to 16 in a U-shape.')
    expect(r.max).toBe(16)
  })

  it('extracts "N rooms per booking"', () => {
    const r = extractCapacity('Available up to 40 rooms per booking.')
    expect(r.max).toBe(40)
  })

  it('extracts "Capacity N theatre / M classroom"', () => {
    const r = extractCapacity('Capacity 50 in theatre style, 30 in classroom setup.')
    expect(r.max).toBe(50)
  })

  it('returns 9999 when no capacity found', () => {
    const r = extractCapacity('Professional service for your event.')
    expect(r.max).toBe(9999)
  })

  it('extracts "for groups up to N"', () => {
    const r = extractCapacity('Half-day spa experience for groups up to 8.')
    expect(r.max).toBe(8)
  })
})

describe('inferIndoorOutdoor', () => {
  it('terrace → outdoor', () => {
    expect(inferIndoorOutdoor('Garden Terrace', '')).toBe('outdoor')
  })

  it('ballroom → indoor', () => {
    expect(inferIndoorOutdoor('Grand Ballroom', '')).toBe('indoor')
  })

  it('no signal → n/a', () => {
    expect(inferIndoorOutdoor('Premium AV Suite', 'Audio-visual package.')).toBe('n/a')
  })
})

describe('inferUnit', () => {
  it('catering → per_person', () => expect(inferUnit('catering')).toBe('per_person'))
  it('accommodation → per_room', () => expect(inferUnit('accommodation')).toBe('per_room'))
  it('venue → per_day', () => expect(inferUnit('venue')).toBe('per_day'))
  it('entertainment → flat', () => expect(inferUnit('entertainment')).toBe('flat'))
})

describe('sourceHash', () => {
  it('produces consistent hash', () => {
    const h1 = sourceHash('Title', 'Description')
    const h2 = sourceHash('Title', 'Description')
    expect(h1).toBe(h2)
  })

  it('different content → different hash', () => {
    const h1 = sourceHash('A', 'B')
    const h2 = sourceHash('C', 'D')
    expect(h1).not.toBe(h2)
  })
})

describe('preParse', () => {
  it('extracts all deterministic fields from seed product', () => {
    const result = preParse(mockSeed, 1)
    expect(result.product_id).toBe(2)
    expect(result.variation_id).toBe(2)
    expect(result.category).toBe('venue')
    expect(result.subtype).toBe('ballroom')
    expect(result.capacity_max).toBe(250)
    expect(result.unit).toBe('per_day')
    expect(result.indoor_outdoor).toBe('indoor')
    expect(result.price_cents).toBe(180000)
    expect(result.source_hash).toBeDefined()
  })
})

describe('enrichProduct — with stubbed LLM', () => {
  const mockExtract = vi.fn().mockResolvedValue({
    tags: ['event', 'gala', 'conference'],
    amenities: ['stage', 'ceiling_screens'],
    dietary_options: [],
    price_model: 'flat rate per day',
  })

  it('returns enriched product with tags and amenities', async () => {
    const partial = preParse(mockSeed, 0)
    const { product, confidence } = await enrichProduct(partial, mockExtract)

    expect(product.tags).toContain('event')
    expect(product.amenities).toContain('stage')
    expect(product.price_model).toBe('flat rate per day')
    expect(confidence).toBe('high')
  })

  it('flags medium confidence when LLM overrides pre-parsed fields', async () => {
    const overrideExtract = vi.fn().mockResolvedValue({
      tags: ['event'],
      amenities: [],
      dietary_options: [],
      price_model: 'per day',
      capacity_max_override: 300,
    })

    const partial = preParse(mockSeed, 0)
    const { product, confidence } = await enrichProduct(partial, overrideExtract)

    expect(product.capacity_max).toBe(300)
    expect(confidence).toBe('medium')
  })
})

describe('buildRetrievalText', () => {
  it('includes all fields in composition', () => {
    const product: EnrichedProduct = {
      product_id: 1,
      variation_id: 1,
      title: 'Test Product',
      description: 'A test.',
      category: 'venue',
      subtype: 'ballroom',
      capacity_min: 0,
      capacity_max: 200,
      unit: 'per_day',
      price_cents: 180000,
      currency: 'EUR',
      tags: ['event', 'gala'],
      amenities: ['stage'],
      dietary_options: [],
      indoor_outdoor: 'indoor',
      retrieval_text: '',
    }

    const text = buildRetrievalText(product)
    expect(text).toContain('Test Product')
    expect(text).toContain('venue ballroom')
    expect(text).toContain('capacity 0-200')
    expect(text).toContain('per_day')
    expect(text).toContain('EUR 1800.00')
    expect(text).toContain('event, gala')
    expect(text).toContain('stage')
    expect(text).toContain('indoor')
    expect(text).toContain('A test.')
  })

  it('omits dietary when empty', () => {
    const product: EnrichedProduct = {
      product_id: 1,
      variation_id: 1,
      title: 'AV Kit',
      description: 'Projector.',
      category: 'av_equipment',
      subtype: 'basic',
      capacity_min: 0,
      capacity_max: 9999,
      unit: 'per_day',
      currency: 'EUR',
      tags: [],
      amenities: [],
      dietary_options: [],
      indoor_outdoor: 'n/a',
      retrieval_text: '',
    }

    const text = buildRetrievalText(product)
    expect(text).not.toContain('dietary')
  })

  it('includes dietary when present', () => {
    const product: EnrichedProduct = {
      product_id: 1,
      variation_id: 1,
      title: 'Lunch',
      description: 'Buffet.',
      category: 'catering',
      subtype: 'lunch',
      capacity_min: 0,
      capacity_max: 100,
      unit: 'per_person',
      currency: 'EUR',
      tags: [],
      amenities: [],
      dietary_options: ['vegetarian', 'gluten_free'],
      indoor_outdoor: 'n/a',
      retrieval_text: '',
    }

    const text = buildRetrievalText(product)
    expect(text).toContain('dietary: vegetarian, gluten_free')
  })
})
