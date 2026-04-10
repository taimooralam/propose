import { ProposalReview } from '@/schemas'
import type { ProposalPlan } from '@/schemas'
import { extractStructuredSonnet } from '@/server/clients/ai'

const SYSTEM_PROMPT = `You are a hotel event proposal quality reviewer. Given an original RFP and a generated proposal, identify gaps, mismatches, and quality issues.

Return JSON with:
- summary: 1-2 sentence overall assessment
- findings: array of {severity, category, description} where:
  - severity: "critical" (blocks submission), "warning" (notable gap), "info" (minor improvement)
  - category: "missing_requirement" (RFP need not addressed), "mismatched_detail" (wrong numbers/dates), "unaddressed_gap" (known gap not explained), "quality" (writing/presentation)
- requirements_met: 0.0-1.0 fraction of RFP requirements addressed in the proposal
- overall_quality: "excellent" | "good" | "adequate" | "poor"

Be rigorous. Check every requirement in the RFP against the proposal blocks.`

/** Self-review a generated proposal against the original RFP.
 *  Uses Sonnet to compare proposal blocks to RFP requirements and flag issues. */
export async function selfReviewProposal(
  rfp: string,
  plan: ProposalPlan,
  extract: typeof extractStructuredSonnet = extractStructuredSonnet,
): Promise<ProposalReview> {
  const blocksText = plan.blocks
    .map(b => `[${(b.slot as { type: string }).type}] ${b.product.title}: ${b.content_md}`)
    .join('\n\n')

  const gapsText = plan.gap_notes.length > 0
    ? `\nKnown gaps:\n${plan.gap_notes.map(g => `- ${g}`).join('\n')}`
    : ''

  const prompt = `Original RFP:
"""
${rfp}
"""

Generated Proposal Blocks:
"""
${blocksText}
"""
${gapsText}

Review this proposal against the original RFP. Check:
1. Is every requirement from the RFP addressed by a proposal block?
2. Are dates, guest counts, and capacity numbers correct?
3. Are known gaps acknowledged?
4. Is the overall quality professional and complete?

Return JSON only.`

  return extract(prompt, ProposalReview, SYSTEM_PROMPT)
}
