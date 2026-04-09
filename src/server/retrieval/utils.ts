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
export function getRequiredCapacity(slot: RequirementSlot): number | undefined {
  if (slot.type === 'accommodation') return slot.rooms ?? slot.guests
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

    // Indoor/outdoor check — n/a products only pass if slot has no preference
    if (slot.indoor_outdoor) {
      if (slot.indoor_outdoor === 'both') return true
      if (product.indoor_outdoor === 'both') return true
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
      p.indoor_outdoor === 'both' ||
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

/** Widen the capacity field that was originally set on the slot. Preserves field semantics. */
function widenCapacity(original: RequirementSlot, relaxed: RequirementSlot, factor: number): void {
  // Only relax the field that was originally populated — don't cross-write rooms↔guests
  if (original.type === 'accommodation') {
    if (original.rooms !== undefined) {
      relaxed.rooms = Math.max(1, Math.floor(original.rooms * factor))
    } else if (original.guests !== undefined) {
      relaxed.guests = Math.max(1, Math.floor(original.guests * factor))
    }
  } else {
    if (original.capacity !== undefined) {
      relaxed.capacity = Math.max(1, Math.floor(original.capacity * factor))
    } else if (original.guests !== undefined) {
      relaxed.guests = Math.max(1, Math.floor(original.guests * factor))
    }
  }
}

/** Create a relaxed copy of a slot for retry round. */
export function relaxSlot(slot: RequirementSlot, round: number): RequirementSlot {
  const relaxed = { ...slot }

  if (round >= 1) {
    // Round 1: drop indoor/outdoor, widen capacity to 80% of original
    delete (relaxed as Record<string, unknown>).indoor_outdoor
    widenCapacity(slot, relaxed, 0.8)
  }

  if (round >= 2) {
    // Round 2: widen capacity further to 60% of original
    widenCapacity(slot, relaxed, 0.6)
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
