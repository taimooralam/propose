import { z } from 'zod'
import type { ProposalPlan, ProposalReview, EvalFlag } from '@/schemas'
import { extractStructuredSonnet } from '@/server/clients/ai'

const CoherenceOutput = z.object({
  completeness: z.number().min(1).max(5),
  relevance: z.number().min(1).max(5),
  coherence: z.number().min(1).max(5),
  professionalism: z.number().min(1).max(5),
  justification: z.string(),
})

const SYSTEM_PROMPT = `You are a proposal quality judge. Score the proposal on 4 dimensions from 1-5:
- completeness: Are all event requirements addressed? (1=many missing, 5=comprehensive)
- relevance: Are the matched products appropriate for the event type? (1=wrong products, 5=perfect fit)
- coherence: Does the proposal flow logically? Are blocks well-connected? (1=disjointed, 5=seamless)
- professionalism: Is the tone appropriate for a hotel proposal? (1=unprofessional, 5=excellent)

Return JSON with scores and a brief justification.`

/** Score proposal coherence using Sonnet as a judge.
 *  Returns a 0-1 coherence score and per-dimension breakdowns. */
export async function scoreProposalCoherence(
  rfp: string,
  plan: ProposalPlan,
  review?: ProposalReview,
  extract: typeof extractStructuredSonnet = extractStructuredSonnet,
): Promise<{ coherence: number; dimensions: Record<string, number>; flags: EvalFlag[] }> {
  const blocksText = plan.blocks
    .map(b => `[${(b.slot as { type: string }).type}] ${b.product.title}: ${b.content_md}`)
    .join('\n\n')

  const reviewContext = review
    ? `\nSelf-review findings: ${review.findings.map(f => f.description).join('; ')}`
    : ''

  const prompt = `RFP: "${rfp.slice(0, 500)}"

Proposal blocks:
${blocksText}
${reviewContext}

Score this proposal. Return JSON only.`

  const scores = await extract(prompt, CoherenceOutput, SYSTEM_PROMPT)

  // Normalize 1-5 scores to 0-1
  const normalize = (v: number) => Math.round(((v - 1) / 4) * 1000) / 1000

  const coherence = normalize(
    (scores.completeness + scores.relevance + scores.coherence + scores.professionalism) / 4,
  )

  const flags: EvalFlag[] = []
  if (scores.completeness <= 2) flags.push('missing_slot_coverage')
  if (scores.coherence <= 2) flags.push('incoherent_block')

  return {
    coherence,
    dimensions: {
      completeness: normalize(scores.completeness),
      relevance: normalize(scores.relevance),
      coherence: normalize(scores.coherence),
      professionalism: normalize(scores.professionalism),
    },
    flags,
  }
}
