import { readFileSync } from 'fs'
import path from 'path'
import { z } from 'zod'
import { SeedProduct } from '../src/schemas/product'
import { preParse } from '../src/server/ingestion/pre-parse'
import { enrichProduct } from '../src/server/ingestion/enrich'
import { buildRetrievalText } from '../src/server/ingestion/retrieval-text'
import { embedProducts } from '../src/server/ingestion/embed'
import { saveCatalog } from '../src/server/ingestion/store'

const SEED_PATH = path.join(process.cwd(), 'data', 'seed', 'products.json')

async function main() {
  const startTime = Date.now()
  console.log('=== Proposales Enrichment Pipeline ===\n')

  // 1. Load seed data
  const raw = JSON.parse(readFileSync(SEED_PATH, 'utf-8'))
  const seeds = z.array(SeedProduct).parse(raw)
  console.log(`Loaded ${seeds.length} seed products\n`)

  // 2. Pre-parse + enrich + build retrieval_text
  const enriched = []
  const failures: { title: string; error: string }[] = []
  const confidenceCounts = { high: 0, medium: 0, low: 0 }

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i]
    try {
      // Stage 1: Deterministic pre-parsing
      const partial = preParse(seed, i)

      // Stage 2: LLM enrichment (Sonnet)
      const { product, confidence } = await enrichProduct(partial)
      confidenceCounts[confidence]++

      // Stage 3: Build retrieval_text
      const withText = { ...product, retrieval_text: buildRetrievalText(product) }

      enriched.push(withText)
      console.log(`  [${i + 1}/${seeds.length}] ✓ ${seed.title} (${seed.category}/${seed.subtype}) — confidence: ${confidence}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ title: seed.title, error: msg })
      console.log(`  [${i + 1}/${seeds.length}] ✗ ${seed.title} — FAILED: ${msg}`)
    }
  }

  console.log('')

  // 3. Batch embed
  console.log('Embedding retrieval texts...')
  const embedded = await embedProducts(enriched)
  console.log(`  Embedded ${embedded.length} products (${embedded[0]?.embedding?.length ?? 0} dimensions)\n`)

  // 4. Save catalog
  await saveCatalog(embedded)
  console.log('Saved to data/catalog.json\n')

  // 5. Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  const categories = embedded.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {})

  console.log('=== Summary ===')
  console.log(`  Products enriched: ${embedded.length}/${seeds.length}`)
  console.log(`  Failures: ${failures.length}`)
  console.log(`  Confidence: high=${confidenceCounts.high} medium=${confidenceCounts.medium} low=${confidenceCounts.low}`)
  console.log(`  Categories: ${JSON.stringify(categories)}`)
  console.log(`  Duration: ${duration}s`)

  if (failures.length > 0) {
    console.log('\n=== Failures ===')
    for (const f of failures) {
      console.log(`  ${f.title}: ${f.error}`)
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
