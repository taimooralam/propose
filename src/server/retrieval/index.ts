import type { EnrichedProduct, CoverageReport, SlotMatch } from '@/schemas'
import { extractSlots } from './extract-slots'
import { matchSlot } from './match-slots'
import { checkCoverage } from './coverage'
import { relaxSlot } from './utils'

const MAX_RETRY_ROUNDS = 2

/** Full retrieval pipeline: extract slots → match → recover gaps → coverage report. */
export async function retrieveForRfp(
  rfp: string,
  catalog: EnrichedProduct[],
): Promise<CoverageReport> {
  const slots = await extractSlots(rfp)

  // Initial matching — all slots in parallel, tolerating individual failures
  const results = await Promise.allSettled(
    slots.map(slot => matchSlot(slot, catalog)),
  )

  const matches: SlotMatch[] = results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    // Individual slot failure → report as uncovered with error detail
    return {
      slot: slots[i],
      candidates: [],
      covered: false,
      gap_reason: 'other' as const,
      gap_detail: `Matching failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      relaxed: false,
    }
  })

  // Gap recovery: retry uncovered required slots with relaxed constraints
  for (let round = 1; round <= MAX_RETRY_ROUNDS; round++) {
    const uncoveredRequired = matches.filter(m => !m.covered && m.slot.required)
    if (uncoveredRequired.length === 0) break

    for (const match of uncoveredRequired) {
      const idx = matches.indexOf(match)
      const relaxed = relaxSlot(match.slot, round)
      const retryResult = await matchSlot(relaxed, catalog)

      if (retryResult.covered) {
        matches[idx] = {
          ...retryResult,
          slot: match.slot, // keep original slot for reporting
          relaxed: true,
        }
      }
    }
  }

  // Replace gap reason on slots that remain uncovered after all retry rounds
  const finalMatches = matches.map(match => {
    if (!match.covered && match.slot.required) {
      return {
        ...match,
        gap_reason: 'no_candidates_after_relaxation' as const,
        gap_detail: `No candidates found for ${match.slot.type} after ${MAX_RETRY_ROUNDS} retry rounds. Original reason: ${match.gap_reason ?? 'unknown'}`,
      }
    }
    return match
  })

  return checkCoverage(finalMatches)
}

export { extractSlots } from './extract-slots'
export { matchSlot } from './match-slots'
export { checkCoverage } from './coverage'
