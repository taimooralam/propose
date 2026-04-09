import type { CoverageReport, EvalResult } from '@/schemas'

/** Compute deterministic evaluation scores from retrieval results.
 *  No LLM calls — pure math on coverage data.
 *
 *  Metrics:
 *  - slot_recall@K: fraction of required slots with ≥1 valid candidate in top K
 *  - full_coverage: fraction of required slots covered (same as coverage_ratio)
 *  - constraint_violation_rate: 0 by construction (hard filters prevent violations)
 *  - coherence: placeholder 0.0 (requires LLM judge, not yet implemented)
 *  - overall: weighted average of implemented metrics
 */
export function computeEvalScores(
  coverage: CoverageReport,
  k = 3,
): EvalResult {
  const requiredMatches = coverage.matches.filter(m => m.slot.required)
  const totalRequired = requiredMatches.length

  // slot_recall@K: for each required slot, is there at least one candidate in top K?
  const slotsWithCandidates = requiredMatches.filter(
    m => m.candidates.length > 0 && m.candidates.length <= k,
  ).length
  // Also count slots with more than K candidates (they have at least K)
  const slotsWithEnoughCandidates = requiredMatches.filter(
    m => m.candidates.length > 0,
  ).length

  const slotRecall = totalRequired === 0 ? 1.0 : slotsWithEnoughCandidates / totalRequired

  // full_coverage: same as coverage_ratio (required slots only)
  const fullCoverage = coverage.coverage_ratio

  // constraint_violation_rate: 0 by construction
  // Hard filters (category, capacity, indoor/outdoor) prevent violations from entering candidates
  const constraintViolationRate = 0.0

  // coherence: not computed without LLM judge
  const coherence = 0.0

  // overall: weighted average (slot_recall 40%, coverage 40%, violations 20%)
  const overall = Math.round(
    (slotRecall * 0.4 + fullCoverage * 0.4 + (1 - constraintViolationRate) * 0.2) * 1000,
  ) / 1000

  // Flags
  const flags: EvalResult['flags'] = []
  if (fullCoverage < 1.0) flags.push('missing_slot_coverage')
  if (constraintViolationRate > 0) flags.push('constraint_violation')

  return {
    slot_recall: Math.round(slotRecall * 1000) / 1000,
    recall_k: k,
    full_coverage: fullCoverage,
    constraint_violation_rate: constraintViolationRate,
    coherence,
    overall,
    dimensions: {
      slot_recall: slotRecall,
      full_coverage: fullCoverage,
      constraint_precision: 1 - constraintViolationRate,
    },
    flags,
  }
}
