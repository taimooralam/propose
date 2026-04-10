import { z } from 'zod'
import type { ProposalPlan, ProposalBlock, RequirementSlot, EnrichedProduct } from '@/schemas'
import { extractStructuredSonnet } from '@/server/clients/ai'

const BlockContent = z.object({
  title: z.string(),
  content_md: z.string(),
  comment: z.string().optional(),
})

const SYSTEM_PROMPT = `You are a hotel event proposal writer. Given an event requirement and a matched product, write a compelling proposal block that connects the product to the specific event need.

Return JSON with:
- title: product title customised for this event (e.g., "Board Meeting — Boardroom Alpha")
- content_md: 2-4 sentences in markdown describing how this product meets the requirement. Reference specific product features. Include capacity confirmation and pricing context.
- comment: optional internal note about the match quality

Tone: professional, warm, confident. Write as if you are the hotel's event coordinator presenting to the client.`

/** Generate content for a single proposal block using Sonnet. */
async function generateBlockCopy(
  rfp: string,
  slot: RequirementSlot,
  product: EnrichedProduct,
  extract: typeof extractStructuredSonnet = extractStructuredSonnet,
): Promise<{ title: string; content_md: string; comment?: string }> {
  const prompt = `Event RFP (excerpt): "${rfp.slice(0, 500)}"

Requirement: ${slot.type} — ${slot.context}
${slot.capacity ? `Capacity needed: ${slot.capacity}` : ''}${slot.guests ? `Guests: ${slot.guests}` : ''}${slot.rooms ? `Rooms: ${slot.rooms}` : ''}

Matched product: ${product.title}
Description: ${product.description}
Category: ${product.category}/${product.subtype ?? ''}
Capacity: ${product.capacity_min}-${product.capacity_max}
Amenities: ${product.amenities.join(', ') || 'none listed'}
Price: ${product.price_cents ? `EUR ${(product.price_cents / 100).toFixed(2)} ${product.unit}` : 'on request'}

Write a proposal block for this match. Return JSON only.`

  return extract(prompt, BlockContent, SYSTEM_PROMPT)
}

/** Generate LLM-written content for all blocks in a proposal plan.
 *  Falls back to thin assembly content if any block generation fails. */
export async function generateProposalBlocks(
  rfp: string,
  plan: ProposalPlan,
  extract: typeof extractStructuredSonnet = extractStructuredSonnet,
): Promise<ProposalPlan> {
  const enhancedBlocks: ProposalBlock[] = []

  for (const block of plan.blocks) {
    try {
      const generated = await generateBlockCopy(rfp, block.slot, block.product, extract)
      enhancedBlocks.push({
        ...block,
        content_md: generated.content_md,
      })
    } catch (err) {
      // Graceful degradation: keep thin assembly content
      console.warn(`Block generation failed for ${block.product.title}: ${err instanceof Error ? err.message : String(err)}`)
      enhancedBlocks.push(block)
    }
  }

  return {
    ...plan,
    blocks: enhancedBlocks,
  }
}
