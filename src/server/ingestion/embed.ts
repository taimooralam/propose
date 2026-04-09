import type { EnrichedProduct } from '@/schemas'
import { embedBatch } from '@/server/clients/ai'

/** Embed all products' retrieval_text in a single batch call.
 *  Returns products with the embedding field populated. */
export async function embedProducts(
  products: EnrichedProduct[],
  embed: (texts: string[]) => Promise<number[][]> = embedBatch,
): Promise<EnrichedProduct[]> {
  if (products.length === 0) return []

  const texts = products.map(p => p.retrieval_text)
  const embeddings = await embed(texts)

  return products.map((product, i) => ({
    ...product,
    embedding: embeddings[i],
  }))
}
