import { NextResponse } from 'next/server'
import { RfpInput } from '@/schemas'
import { loadCatalog } from '@/server/ingestion/store'
import { retrieveForRfp } from '@/server/retrieval'
import { assembleThinProposal } from '@/server/pipeline/assemble-thin'
import { generateProposalBlocks } from '@/server/pipeline/generate-blocks'
import { createProposal, toApiProposalPayload } from '@/server/clients/proposales'
import { selfReviewProposal } from '@/server/pipeline/self-review'
import { evaluateProposal } from '@/server/evaluation'

export const maxDuration = 60 // Vercel Pro timeout

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // 1. Validate input
    const body = await request.json()
    const input = RfpInput.parse(body)

    // 2. Load enriched catalog
    const catalog = await loadCatalog()
    if (catalog.length === 0) {
      return NextResponse.json(
        { error: 'Catalog is empty. Run `pnpm seed` first to enrich products.' },
        { status: 503 },
      )
    }

    // 3. Retrieval: extract slots → match → coverage → gap recovery
    const coverage = await retrieveForRfp(input.text, catalog)

    // 4. Thin proposal assembly (pick top candidate per slot)
    const thinPlan = assembleThinProposal(input.text.slice(0, 200), coverage)

    // 5. LLM block generation (Sonnet writes content per block)
    let plan = thinPlan
    try {
      plan = await generateProposalBlocks(input.text, thinPlan)
    } catch (err) {
      console.warn('Block generation failed, using thin assembly:', err instanceof Error ? err.message : String(err))
    }

    // 6. Create proposal via Proposales API (optional — needs PROPOSALES_API_KEY)
    let proposalUuid: string | undefined
    let proposalUrl: string | undefined
    if (process.env.PROPOSALES_API_KEY) {
      try {
        const companyId = parseInt(process.env.PROPOSALES_COMPANY_ID ?? '5265')
        const payload = toApiProposalPayload(plan, {
          companyId,
          titleMd: `Proposal: ${input.text.slice(0, 80)}...`,
          descriptionMd: plan.rfp_summary,
        })
        const result = await createProposal(payload)
        proposalUuid = result.uuid
        proposalUrl = result.url
      } catch (err) {
        console.warn('Proposales API call failed:', err instanceof Error ? err.message : String(err))
      }
    }

    // 7. Self-review: compare proposal against original RFP
    let review = undefined
    try {
      review = await selfReviewProposal(input.text, plan)
    } catch (err) {
      console.warn('Self-review failed:', err instanceof Error ? err.message : String(err))
    }

    // 8. Full evaluation: deterministic + heuristic + LLM coherence
    const slots = coverage.matches.map(m => m.slot)
    const evaluation = await evaluateProposal({
      rfp: input.text,
      coverage,
      slots,
      plan,
      review: review ?? undefined,
    })

    // 8. Build response
    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      status: 'complete',
      slots,
      coverage,
      plan,
      review,
      proposal_uuid: proposalUuid,
      proposal_url: proposalUrl,
      evaluation,
      meta: {
        latency_ms: latencyMs,
        catalog_size: catalog.length,
        slot_count: coverage.matches.length,
        blocks_generated: plan.blocks.length,
        proposal_created: !!proposalUuid,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: message, status: 'failed' },
      { status: 500 },
    )
  }
}
