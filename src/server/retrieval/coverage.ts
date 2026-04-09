import type { SlotMatch, CoverageReport } from '@/schemas'

/** Calculate coverage report from slot matches. Pure function — no retry logic.
 *  coverage_ratio is based on required slots only. Optional slots are tracked but don't affect the ratio. */
export function checkCoverage(matches: SlotMatch[]): CoverageReport {
  const requiredMatches = matches.filter(m => m.slot.required)
  const coveredRequired = requiredMatches.filter(m => m.covered)

  const totalRequired = requiredMatches.length
  const coveredCount = coveredRequired.length
  const coverageRatio = totalRequired === 0 ? 1.0 : coveredCount / totalRequired

  // Collect gaps from ALL uncovered slots (required + optional)
  const gaps = matches
    .filter(m => !m.covered)
    .map(m => ({
      slot_context: m.slot.context,
      reason: m.gap_reason ?? 'other' as const,
      detail: m.gap_detail,
    }))

  return {
    total_slots: totalRequired,
    covered_slots: coveredCount,
    coverage_ratio: Math.round(coverageRatio * 1000) / 1000,
    gaps,
    matches,
  }
}
