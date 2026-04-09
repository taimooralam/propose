import type { RequirementSlot, EnrichedProduct, SlotMatch, RankedCandidate } from '@/schemas'
import { hardFilter, cosineSimilarity, diagnoseGap } from './utils'
import { embedText } from '@/server/clients/ai'

const MAX_CANDIDATES = 3

/** Compute similarity between slot context and product, using embeddings if available. */
async function rankCandidates(
  slot: RequirementSlot,
  filtered: EnrichedProduct[],
  embed: (text: string) => Promise<number[]> = embedText,
): Promise<RankedCandidate[]> {
  if (filtered.length === 0) return []

  // Score each product: use embedding if available, fall back to text overlap on failure
  const hasAnyEmbedding = filtered.some(p => p.embedding && p.embedding.length > 0)
  let slotEmbedding: number[] | null = null
  if (hasAnyEmbedding) {
    try {
      slotEmbedding = await embed(slot.context)
    } catch {
      // Embedding service down — graceful degradation to text overlap
      slotEmbedding = null
    }
  }

  if (slotEmbedding && slotEmbedding.length > 0) {
    const scored: RankedCandidate[] = filtered.map(product => ({
      product,
      similarity: product.embedding && product.embedding.length > 0
        ? cosineSimilarity(slotEmbedding!, product.embedding)
        : textOverlapScore(slot.context, product.retrieval_text),
    }))

    scored.sort((a, b) => b.similarity - a.similarity)
    return scored.slice(0, MAX_CANDIDATES)
  }

  // Full fallback: text overlap scoring when no embeddings exist
  const scored: RankedCandidate[] = filtered.map(product => ({
    product,
    similarity: textOverlapScore(slot.context, product.retrieval_text),
  }))

  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, MAX_CANDIDATES)
}

/** Simple text overlap scoring as fallback when embeddings are unavailable. */
function textOverlapScore(query: string, document: string): number {
  const queryTokens = new Set(query.toLowerCase().split(/\W+/).filter(Boolean))
  const docTokens = new Set(document.toLowerCase().split(/\W+/).filter(Boolean))

  let overlap = 0
  for (const token of queryTokens) {
    if (docTokens.has(token)) overlap++
  }

  return queryTokens.size === 0 ? 0 : overlap / queryTokens.size
}

/** Match a single slot against the catalog. Returns SlotMatch with ranked candidates and coverage status. */
export async function matchSlot(
  slot: RequirementSlot,
  catalog: EnrichedProduct[],
  embed: (text: string) => Promise<number[]> = embedText,
): Promise<SlotMatch> {
  const filtered = hardFilter(slot, catalog)

  if (filtered.length === 0) {
    const gap = diagnoseGap(slot, catalog)
    return {
      slot,
      candidates: [],
      covered: false,
      gap_reason: gap.reason,
      gap_detail: gap.detail,
      relaxed: false,
    }
  }

  const candidates = await rankCandidates(slot, filtered, embed)

  return {
    slot,
    candidates,
    covered: candidates.length > 0,
    relaxed: false,
  }
}
