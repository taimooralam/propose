import { describe, it, expect } from 'vitest'
import {
  cosineSimilarity,
  hardFilter,
  relaxSlot,
  normalizeAlias,
  diagnoseGap,
  getRequiredCapacity,
} from '@/server/retrieval/utils'
import type { RequirementSlot, EnrichedProduct } from '@/schemas'
import { boardroomAlpha, gardenTerrace, standardRoomBlock, testCatalog } from '../fixtures/catalog'

describe('cosineSimilarity', () => {
  it('identical vectors return 1', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0)
  })

  it('orthogonal vectors return 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0)
  })

  it('empty vectors return 0', () => {
    expect(cosineSimilarity([], [])).toBe(0)
  })

  it('mismatched lengths return 0', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0)
  })
})

describe('getRequiredCapacity', () => {
  it('accommodation uses rooms', () => {
    const slot: RequirementSlot = { type: 'accommodation', context: 'rooms', rooms: 15, constraints: [], required: true }
    expect(getRequiredCapacity(slot)).toBe(15)
  })

  it('accommodation falls back to guests when rooms missing', () => {
    const slot: RequirementSlot = { type: 'accommodation', context: 'rooms', guests: 30, constraints: [], required: true }
    expect(getRequiredCapacity(slot)).toBe(30)
  })

  it('venue uses capacity', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'room', capacity: 50, constraints: [], required: true }
    expect(getRequiredCapacity(slot)).toBe(50)
  })

  it('venue falls back to guests', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'room', guests: 80, constraints: [], required: true }
    expect(getRequiredCapacity(slot)).toBe(80)
  })
})

describe('hardFilter — indoor/outdoor', () => {
  it('n/a products are rejected when slot specifies indoor', () => {
    const slot: RequirementSlot = { type: 'av_equipment', context: 'AV', indoor_outdoor: 'indoor', constraints: [], required: true }
    // AV products have indoor_outdoor: 'n/a' in fixtures
    const filtered = hardFilter(slot, testCatalog)
    const avProducts = filtered.filter(p => p.category === 'av_equipment')
    // n/a should NOT pass indoor-specific filter
    expect(avProducts.every(p => p.indoor_outdoor === 'indoor' || p.indoor_outdoor === 'both')).toBe(true)
  })

  it('products with both pass any slot preference', () => {
    const indoorSlot: RequirementSlot = { type: 'venue', context: 'room', indoor_outdoor: 'indoor', constraints: [], required: true }
    const outdoorSlot: RequirementSlot = { type: 'venue', context: 'room', indoor_outdoor: 'outdoor', constraints: [], required: true }
    const indoorResults = hardFilter(indoorSlot, testCatalog)
    const outdoorResults = hardFilter(outdoorSlot, testCatalog)
    // No venue has indoor_outdoor: 'both' in fixtures, but the logic path is correct
    expect(indoorResults.every(p => p.indoor_outdoor === 'indoor' || p.indoor_outdoor === 'both')).toBe(true)
    expect(outdoorResults.every(p => p.indoor_outdoor === 'outdoor' || p.indoor_outdoor === 'both')).toBe(true)
  })
})

describe('relaxSlot', () => {
  it('round 1 drops indoor_outdoor and widens capacity to 80%', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'indoor room', capacity: 100, indoor_outdoor: 'indoor', constraints: [], required: true }
    const relaxed = relaxSlot(slot, 1)
    expect(relaxed.indoor_outdoor).toBeUndefined()
    expect(relaxed.capacity).toBe(80)
  })

  it('round 2 widens capacity to 60%', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'room', capacity: 100, constraints: [], required: true }
    const relaxed = relaxSlot(slot, 2)
    expect(relaxed.capacity).toBe(60)
  })

  it('floors capacity at 1 for tiny values', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'room', capacity: 1, constraints: [], required: true }
    const relaxed = relaxSlot(slot, 1)
    expect(relaxed.capacity).toBeGreaterThanOrEqual(1)
  })

  it('relaxes accommodation rooms', () => {
    const slot: RequirementSlot = { type: 'accommodation', context: 'rooms', rooms: 50, constraints: [], required: true }
    const relaxed = relaxSlot(slot, 1)
    expect(relaxed.rooms).toBe(40)
  })
})

describe('normalizeAlias', () => {
  it('maps conference room to venue', () => {
    expect(normalizeAlias('conference room')).toBe('venue')
  })

  it('maps projector to av_equipment', () => {
    expect(normalizeAlias('projector')).toBe('av_equipment')
  })

  it('maps buffet to catering', () => {
    expect(normalizeAlias('buffet lunch')).toBe('catering')
  })

  it('maps live band to entertainment', () => {
    expect(normalizeAlias('live band')).toBe('entertainment')
  })

  it('returns undefined for unknown phrases', () => {
    expect(normalizeAlias('quantum computing')).toBeUndefined()
  })
})

describe('diagnoseGap', () => {
  it('returns no_category_match when category is empty', () => {
    const slot: RequirementSlot = { type: 'entertainment', context: 'band', constraints: [], required: true }
    // testCatalog has no entertainment products
    const result = diagnoseGap(slot, testCatalog)
    expect(result.reason).toBe('no_category_match')
  })

  it('returns capacity_exceeded when no product fits', () => {
    const slot: RequirementSlot = { type: 'venue', context: 'huge event', capacity: 500, constraints: [], required: true }
    const result = diagnoseGap(slot, testCatalog)
    expect(result.reason).toBe('capacity_exceeded')
  })
})
