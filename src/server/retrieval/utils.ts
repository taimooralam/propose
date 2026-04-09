import type { RequirementSlot, EnrichedProduct } from '@/schemas'

/** Cosine similarity between two vectors. Returns value between -1 and 1. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

/** Get the required capacity from a slot based on its type. */
function getRequiredCapacity(slot: RequirementSlot): number | undefined {
  if (slot.type === 'accommodation') return slot.rooms
  return slot.capacity ?? slot.guests
}

/** Hard-filter catalog for a single slot. Returns only products that pass all deterministic constraints. */
export function hardFilter(slot: RequirementSlot, catalog: EnrichedProduct[]): EnrichedProduct[] {
  return catalog.filter(product => {
    // Category must match slot type
    if (product.category !== slot.type) return false

    // Capacity check
    const required = getRequiredCapacity(slot)
    if (required !== undefined && product.capacity_max < required) return false

    // Indoor/outdoor check
    if (slot.indoor_outdoor) {
      if (product.indoor_outdoor === 'n/a') return true // n/a passes any filter
      if (slot.indoor_outdoor === 'both') return true // 'both' accepts any
      if (product.indoor_outdoor === 'both') return true // product supports both
      if (product.indoor_outdoor !== slot.indoor_outdoor) return false
    }

    return true
  })
}

/** Determine the gap reason when no candidates pass filtering. */
export function diagnoseGap(
  slot: RequirementSlot,
  catalog: EnrichedProduct[],
): { reason: 'no_category_match' | 'capacity_exceeded' | 'indoor_outdoor_mismatch' | 'no_candidates_after_relaxation' | 'other'; detail: string } {
  const categoryMatches = catalog.filter(p => p.category === slot.type)

  if (categoryMatches.length === 0) {
    return { reason: 'no_category_match', detail: `No ${slot.type} products in catalog` }
  }

  const required = getRequiredCapacity(slot)
  if (required !== undefined) {
    const capacityMatches = categoryMatches.filter(p => p.capacity_max >= required)
    if (capacityMatches.length === 0) {
      return {
        reason: 'capacity_exceeded',
        detail: `No ${slot.type} product supports capacity ${required}. Max available: ${Math.max(...categoryMatches.map(p => p.capacity_max))}`,
      }
    }
  }

  if (slot.indoor_outdoor) {
    const envMatches = categoryMatches.filter(p =>
      p.indoor_outdoor === 'n/a' || p.indoor_outdoor === 'both' ||
      slot.indoor_outdoor === 'both' || p.indoor_outdoor === slot.indoor_outdoor,
    )
    if (envMatches.length === 0) {
      return {
        reason: 'indoor_outdoor_mismatch',
        detail: `No ${slot.type} product matches ${slot.indoor_outdoor} requirement`,
      }
    }
  }

  return { reason: 'other', detail: `No matching products for: ${slot.context}` }
}

/** Create a relaxed copy of a slot for retry round. */
export function relaxSlot(slot: RequirementSlot, round: number): RequirementSlot {
  const relaxed = { ...slot }

  if (round >= 1) {
    // Round 1: drop indoor/outdoor, widen capacity by 20%
    delete (relaxed as Record<string, unknown>).indoor_outdoor
    const required = getRequiredCapacity(relaxed)
    if (required !== undefined) {
      const widened = Math.floor(required * 0.8)
      if (relaxed.type === 'accommodation') {
        relaxed.rooms = widened
      } else if (relaxed.guests !== undefined) {
        relaxed.guests = widened
      } else if (relaxed.capacity !== undefined) {
        relaxed.capacity = widened
      }
    }
  }

  if (round >= 2) {
    // Round 2: remove subtype preference from constraints
    relaxed.constraints = relaxed.constraints.filter(c => !c.startsWith('subtype:'))
  }

  return relaxed
}

const ALIAS_MAP: Record<string, RequirementSlot['type']> = {
  'conference room': 'venue',
  'meeting room': 'venue',
  'boardroom': 'venue',
  'ballroom': 'venue',
  'banquet hall': 'venue',
  'event space': 'venue',
  'projector': 'av_equipment',
  'screen': 'av_equipment',
  'av': 'av_equipment',
  'audio visual': 'av_equipment',
  'sound system': 'av_equipment',
  'lunch': 'catering',
  'dinner': 'catering',
  'brunch': 'catering',
  'buffet': 'catering',
  'coffee': 'catering',
  'cocktail': 'catering',
  'bar service': 'catering',
  'room': 'accommodation',
  'suite': 'accommodation',
  'hotel room': 'accommodation',
  'wifi': 'service',
  'registration': 'service',
  'valet': 'service',
  'parking': 'service',
  'spa': 'activity',
  'tour': 'activity',
  'wine tasting': 'activity',
  'floral': 'decoration',
  'flowers': 'decoration',
  'candle': 'decoration',
  'dj': 'entertainment',
  'band': 'entertainment',
  'music': 'entertainment',
  'live band': 'entertainment',
  'quartet': 'entertainment',
  'vegetarian': 'dietary',
  'vegan': 'dietary',
  'gluten-free': 'dietary',
  'halal': 'dietary',
  'kosher': 'dietary',
  'dietary': 'dietary',
}

/** Normalize an alias phrase to a SlotType. Returns undefined if no match. */
export function normalizeAlias(phrase: string): RequirementSlot['type'] | undefined {
  const lower = phrase.toLowerCase()
  for (const [alias, slotType] of Object.entries(ALIAS_MAP)) {
    if (lower.includes(alias)) return slotType
  }
  return undefined
}
