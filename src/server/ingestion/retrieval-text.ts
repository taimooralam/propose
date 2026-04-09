import type { EnrichedProduct } from '@/schemas'

/** Format price in cents to a human-readable string. */
function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

/** Build the retrieval text for embedding. Includes structured metadata + natural language description.
 *  This string is what gets embedded — it should contain everything relevant for semantic search. */
export function buildRetrievalText(product: EnrichedProduct): string {
  const parts: string[] = [
    product.title,
    `${product.category} ${product.subtype ?? ''}`.trim(),
    `capacity ${product.capacity_min}-${product.capacity_max}`,
    product.unit,
  ]

  if (product.price_cents !== undefined) {
    parts.push(formatPrice(product.price_cents, product.currency))
  }

  if (product.tags.length > 0) {
    parts.push(product.tags.join(', '))
  }

  if (product.amenities.length > 0) {
    parts.push(product.amenities.join(', '))
  }

  if (product.dietary_options.length > 0) {
    parts.push(`dietary: ${product.dietary_options.join(', ')}`)
  }

  parts.push(product.indoor_outdoor)
  parts.push(product.description)

  return parts.join(' | ')
}
