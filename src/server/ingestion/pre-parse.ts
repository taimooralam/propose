import { createHash } from 'crypto'
import type { SeedProduct, EnrichedProduct, SlotType } from '@/schemas'

/** Extract capacity numbers from a product description using regex patterns. */
function extractCapacity(description: string): { min: number; max: number } {
  // "N guests for seated dinner or M standing" or "N seated / M standing"
  const layoutMatch = description.match(/(\d+)\s*(?:guests?\s+(?:for\s+)?)?(?:seated|theatre|classroom|boardroom).*?(\d+)\s*(?:standing|reception|cocktail)/i)
  if (layoutMatch) {
    const a = parseInt(layoutMatch[1])
    const b = parseInt(layoutMatch[2])
    return { min: 0, max: Math.max(a, b) }
  }

  // "N theatre / M classroom" or "N in theatre style, M in classroom"
  const styleMatch = description.match(/(\d+)\s*(?:in\s+)?theatre.*?(\d+)\s*(?:in\s+)?classroom/i)
  if (styleMatch) {
    const a = parseInt(styleMatch[1])
    const b = parseInt(styleMatch[2])
    return { min: 0, max: Math.max(a, b) }
  }

  // "up to N rooms per booking"
  const roomsMatch = description.match(/(?:up\s+to|available)\s+(\d+)\s*rooms/i)
  if (roomsMatch) return { min: 1, max: parseInt(roomsMatch[1]) }

  // "up to N guests/people/participants"
  const upToMatch = description.match(/(?:up\s+to|accommodates?|seats?\s+up\s+to|serves?\s+up\s+to|for\s+(?:up\s+to|groups?\s+up\s+to))\s+(\d+)/i)
  if (upToMatch) return { min: 0, max: parseInt(upToMatch[1]) }

  // "N-M people/guests"
  const rangeMatch = description.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:people|guests|participants|attendees)/i)
  if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) }

  // "for N people/guests" (exact)
  const exactMatch = description.match(/for\s+(\d+)\s*(?:people|guests|participants)/i)
  if (exactMatch) return { min: 0, max: parseInt(exactMatch[1]) }

  return { min: 0, max: 9999 }
}

/** Infer indoor/outdoor from title and description keywords. */
function inferIndoorOutdoor(title: string, description: string): 'indoor' | 'outdoor' | 'both' | 'n/a' {
  const text = `${title} ${description}`.toLowerCase()

  const outdoorSignals = ['terrace', 'garden', 'outdoor', 'open-air', 'open air', 'rooftop', 'patio']
  const indoorSignals = ['ballroom', 'boardroom', 'conference room', 'dining room', 'workshop room', 'hotel room', 'bridal suite']

  const isOutdoor = outdoorSignals.some(s => text.includes(s))
  const isIndoor = indoorSignals.some(s => text.includes(s))

  if (isOutdoor && isIndoor) return 'both'
  if (isOutdoor) return 'outdoor'
  if (isIndoor) return 'indoor'
  return 'n/a'
}

/** Infer pricing unit from product category. */
function inferUnit(category: SlotType): 'per_person' | 'per_day' | 'flat' | 'per_room' | 'per_hour' {
  const unitMap: Record<SlotType, 'per_person' | 'per_day' | 'flat' | 'per_room' | 'per_hour'> = {
    venue: 'per_day',
    catering: 'per_person',
    accommodation: 'per_room',
    av_equipment: 'per_day',
    activity: 'per_person',
    decoration: 'flat',
    entertainment: 'flat',
    service: 'per_day',
    dietary: 'per_person',
  }
  return unitMap[category]
}

/** Compute a SHA-256 hash of the product's content for idempotency checks. */
function sourceHash(title: string, description: string): string {
  return createHash('sha256').update(`${title}|${description}`).digest('hex').slice(0, 16)
}

/** Deterministic pre-parsing: extract what we can from seed data without LLM calls.
 *  Returns a partial EnrichedProduct with fields that are known or inferable. */
export function preParse(seed: SeedProduct, index: number): Partial<EnrichedProduct> & { source_hash: string } {
  const capacity = extractCapacity(seed.description)

  return {
    product_id: index + 1,
    variation_id: index + 1,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    subtype: seed.subtype,
    capacity_min: capacity.min,
    capacity_max: capacity.max,
    unit: inferUnit(seed.category),
    price_cents: seed.price_cents,
    currency: seed.currency,
    indoor_outdoor: inferIndoorOutdoor(seed.title, seed.description),
    source_hash: sourceHash(seed.title, seed.description),
  }
}

// Re-export for testing
export { extractCapacity, inferIndoorOutdoor, inferUnit, sourceHash }
