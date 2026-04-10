import type { CreateProposalPayload, ProposalPlan, ApiProposalBlock } from '@/schemas'

const BASE_URL = 'https://api.proposales.com/v3'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Create a proposal via the Proposales API. Returns the proposal UUID and viewing URL. */
export async function createProposal(
  payload: CreateProposalPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ uuid: string; url: string }> {
  const apiKey = process.env.PROPOSALES_API_KEY
  if (!apiKey) throw new Error('PROPOSALES_API_KEY is required')

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetchImpl(`${BASE_URL}/proposals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Proposales API error ${response.status}: ${body}`)
      }

      const data = await response.json() as { proposal: { uuid: string; url: string } }
      return { uuid: data.proposal.uuid, url: data.proposal.url }
    } catch (err) {
      if (attempt === 2) throw err
      const delay = Math.pow(2, attempt) * 1000
      console.warn(`Proposales API call failed (attempt ${attempt + 1}/3), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  throw new Error('Unreachable')
}

/** Map internal ProposalPlan to Proposales API payload format. */
export function toApiProposalPayload(
  plan: ProposalPlan,
  opts: {
    companyId: number
    language?: string
    titleMd?: string
    descriptionMd?: string
  },
): CreateProposalPayload {
  const blocks: ApiProposalBlock[] = plan.blocks.map(block => ({
    content_id: block.product.variation_id,
    type: 'product-block' as const,
    title: block.product.title,
    description: block.content_md,
    quantity: block.quantity,
    unit_value_without_discount_without_tax: block.unit_value_cents,
    unit_value_with_discount_without_tax: block.unit_value_cents,
    unit_value_without_discount_with_tax: block.unit_value_cents,
    unit_value_with_discount_with_tax: block.unit_value_cents,
    currency: block.product.currency,
    optional: !block.slot.required,
  }))

  return {
    company_id: opts.companyId,
    language: opts.language ?? 'en',
    title_md: opts.titleMd ?? 'AI-Generated Proposal',
    description_md: opts.descriptionMd ?? plan.rfp_summary,
    blocks,
  }
}
