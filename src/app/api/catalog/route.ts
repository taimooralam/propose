import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'
import { getCatalogHealth } from '@/server/ingestion/health'

/** GET /api/catalog — returns catalog health, enriched products (sans embeddings), and raw seed data. */
export async function GET() {
  try {
    const health = await getCatalogHealth()

    // Strip embeddings from response to reduce payload size
    const products = health.products.map(({ embedding, ...rest }) => rest)

    // Load raw seed data for before/after comparison
    let seedProducts: unknown[] = []
    try {
      const seedPath = path.join(process.cwd(), 'data', 'seed', 'products.json')
      seedProducts = JSON.parse(readFileSync(seedPath, 'utf-8'))
    } catch {
      // Seed file may not exist in all environments
    }

    return NextResponse.json({
      meta: health.meta,
      productCount: health.productCount,
      categoryCounts: health.categoryCounts,
      embeddingCoverage: health.embeddingCoverage,
      products,
      seedProducts,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load catalog' },
      { status: 500 },
    )
  }
}
