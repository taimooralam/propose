import { NextResponse } from 'next/server'
import { getCatalogHealth } from '@/server/ingestion/health'

/** GET /api/catalog — returns catalog health metrics and product list (without embeddings). */
export async function GET() {
  try {
    const health = await getCatalogHealth()

    // Strip embeddings from response to reduce payload size
    const products = health.products.map(({ embedding, ...rest }) => rest)

    return NextResponse.json({
      meta: health.meta,
      productCount: health.productCount,
      categoryCounts: health.categoryCounts,
      embeddingCoverage: health.embeddingCoverage,
      products,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load catalog' },
      { status: 500 },
    )
  }
}
