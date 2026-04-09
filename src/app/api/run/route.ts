import { NextResponse } from 'next/server'
import { RfpInput } from '@/schemas'
import { loadCatalog } from '@/server/ingestion/store'
import { retrieveForRfp } from '@/server/retrieval'
import { assembleThinProposal } from '@/server/pipeline/assemble-thin'
import { computeEvalScores } from '@/server/evaluation/heuristic'

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
    const plan = assembleThinProposal(input.text.slice(0, 200), coverage)

    // 5. Deterministic evaluation scores
    const evaluation = computeEvalScores(coverage)

    // 6. Build response
    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      status: 'complete',
      slots: coverage.matches.map(m => m.slot),
      coverage,
      plan,
      evaluation,
      meta: {
        latency_ms: latencyMs,
        catalog_size: catalog.length,
        slot_count: coverage.matches.length,
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
