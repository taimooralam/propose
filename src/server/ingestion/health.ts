import type { EnrichedProduct } from '@/schemas'
import { loadCatalogWithMeta, type CatalogMeta } from './store'

export interface CatalogHealth {
  meta: CatalogMeta | null
  productCount: number
  categoryCounts: Record<string, number>
  embeddingCoverage: number
  products: EnrichedProduct[]
}

/** Get catalog health metrics for the ingestion dashboard. */
export async function getCatalogHealth(): Promise<CatalogHealth> {
  const result = await loadCatalogWithMeta()

  if (!result) {
    return {
      meta: null,
      productCount: 0,
      categoryCounts: {},
      embeddingCoverage: 0,
      products: [],
    }
  }

  const { meta, products } = result

  const categoryCounts: Record<string, number> = {}
  let withEmbeddings = 0

  for (const product of products) {
    categoryCounts[product.category] = (categoryCounts[product.category] ?? 0) + 1
    if (product.embedding && product.embedding.length > 0) withEmbeddings++
  }

  return {
    meta,
    productCount: products.length,
    categoryCounts,
    embeddingCoverage: products.length === 0 ? 0 : Math.round((withEmbeddings / products.length) * 1000) / 1000,
    products,
  }
}
