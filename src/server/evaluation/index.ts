import type { CoverageReport, RequirementSlot, ProposalPlan, ProposalReview, EvalResult } from '@/schemas'
import { computeEvalScores } from './heuristic'
import { validateProposalHeuristics } from './validate'
import { scoreProposalCoherence } from './coherence'

/** Full evaluation: deterministic metrics + heuristic validation + LLM coherence.
 *  Combines all three sources into a single EvalResult. */
export async function evaluateProposal(input: {
  rfp: string
  coverage: CoverageReport
  slots: RequirementSlot[]
  plan: ProposalPlan
  review?: ProposalReview
}): Promise<EvalResult> {
  // 1. Deterministic metrics (slot_recall, coverage, violations)
  const base = computeEvalScores(input.coverage)

  // 2. Heuristic validation (dates, guest counts, slot-block coverage)
  const heuristics = validateProposalHeuristics(input.slots, input.plan)

  // 3. LLM coherence scoring (completeness, relevance, coherence, professionalism)
  let coherenceScore = 0
  let coherenceDimensions: Record<string, number> = {}
  try {
    const coherenceResult = await scoreProposalCoherence(input.rfp, input.plan, input.review)
    coherenceScore = coherenceResult.coherence
    coherenceDimensions = coherenceResult.dimensions
    base.flags.push(...coherenceResult.flags)
  } catch (err) {
    console.warn('LLM coherence scoring failed:', err instanceof Error ? err.message : String(err))
  }

  // 4. Combine all dimensions
  const allDimensions = {
    ...base.dimensions,
    ...heuristics.dimensions,
    ...coherenceDimensions,
  }

  // 5. Recalculate overall with coherence included
  // Weights: slot_recall 30%, coverage 30%, coherence 20%, heuristic 20%
  const heuristicAvg = Object.values(heuristics.dimensions).reduce((a, b) => a + b, 0) /
    Math.max(Object.values(heuristics.dimensions).length, 1)

  const overall = Math.round(
    (base.slot_recall * 0.3 + base.full_coverage * 0.3 + coherenceScore * 0.2 + heuristicAvg * 0.2) * 1000,
  ) / 1000

  return {
    ...base,
    coherence: coherenceScore,
    overall,
    dimensions: allDimensions,
    flags: [...new Set([...base.flags, ...heuristics.flags])],
  }
}
