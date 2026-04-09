import type { CoverageReport, ProposalPlan, ProposalBlock } from '@/schemas'

/** Assemble a thin proposal plan from coverage results.
 *  Picks the top candidate per covered slot and creates minimal blocks.
 *  No LLM generation — just data structuring for the demo. */
export function assembleThinProposal(
  rfpSummary: string,
  coverage: CoverageReport,
): ProposalPlan {
  const blocks: ProposalBlock[] = []
  const gapNotes: string[] = []

  for (const match of coverage.matches) {
    if (match.covered && match.candidates.length > 0) {
      const top = match.candidates[0]
      blocks.push({
        slot: match.slot,
        product: top.product,
        content_md: `**${top.product.title}** — ${top.product.description}`,
        quantity: getQuantity(match.slot),
        unit_value_cents: top.product.price_cents ?? 0,
      })
    } else {
      gapNotes.push(
        `No product available for ${match.slot.type}: ${match.slot.context}` +
        (match.gap_reason ? ` (${match.gap_reason})` : ''),
      )
    }
  }

  return {
    rfp_summary: rfpSummary,
    blocks,
    gap_notes: gapNotes,
  }
}

/** Determine quantity from slot fields. */
function getQuantity(slot: { guests?: number; rooms?: number; capacity?: number }): number {
  return slot.guests ?? slot.rooms ?? slot.capacity ?? 1
}
