import type { EnrichedProduct, CoverageReport } from '@/schemas'
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

  // Initial matching — all slots in parallel
  const matches = await Promise.all(
    slots.map(slot => matchSlot(slot, catalog)),
  )

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

  return checkCoverage(matches)
}

export { extractSlots } from './extract-slots'
export { matchSlot } from './match-slots'
export { checkCoverage } from './coverage'
