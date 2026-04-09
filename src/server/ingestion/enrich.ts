import { z } from 'zod'
import { EnrichedProduct } from '@/schemas'
import { extractStructuredSonnet } from '@/server/clients/ai'

const EnrichmentOutput = z.object({
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  dietary_options: z.array(z.string()).default([]),
  price_model: z.string().optional(),
  category_override: z.string().optional(),
  capacity_max_override: z.number().optional(),
  indoor_outdoor_override: z.enum(['indoor', 'outdoor', 'both', 'n/a']).optional(),
})

const SYSTEM_PROMPT = `You are a hotel product metadata extractor. You will receive a hotel product with pre-parsed metadata and must extract additional fields and verify existing ones.

Return a JSON object with:
- tags: array of 4-8 searchable keywords relevant to event planning
- amenities: array of specific features/equipment mentioned in the description
- dietary_options: array of dietary accommodations (only for catering products, empty otherwise)
- price_model: human-readable pricing description (e.g., "per person per day", "flat rate")
- category_override: only if the pre-assigned category is WRONG (null otherwise)
- capacity_max_override: only if the pre-parsed capacity is WRONG (null otherwise)
- indoor_outdoor_override: only if the pre-parsed indoor/outdoor is WRONG (null otherwise)

Rules:
- Tags should be useful for event planners searching for products
- Amenities are physical features or services explicitly mentioned in the description
- Only override pre-parsed fields if you have strong evidence they are wrong
- For AV/service products, capacity numbers in descriptions are NOT guest capacity
- For accommodation, capacity is measured in rooms, not guests`

const FEW_SHOT = `
Example — Venue with multi-layout capacity:
Title: "Grand Ballroom", Description: "Accommodates 180 seated or 250 standing. Crystal chandeliers."
Pre-parsed: category=venue, capacity_max=250, indoor_outdoor=indoor
Output: {"tags":["event","gala","conference","wedding","large"],"amenities":["chandeliers"],"dietary_options":[],"price_model":"flat rate per day"}

Example — Accommodation:
Title: "Standard Room Block", Description: "Available up to 40 rooms per booking."
Pre-parsed: category=accommodation, capacity_max=40, indoor_outdoor=n/a
Output: {"tags":["room","accommodation","standard","hotel"],"amenities":[],"dietary_options":[],"price_model":"per room per night"}

Example — Catering with dietary:
Title: "Executive Lunch Buffet", Description: "Three-course buffet. Dietary labels for all items."
Pre-parsed: category=catering, capacity_max=150, indoor_outdoor=n/a
Output: {"tags":["lunch","buffet","corporate"],"amenities":[],"dietary_options":["vegetarian","gluten_free"],"price_model":"per person"}
`

export interface EnrichmentResult {
  product: EnrichedProduct
  confidence: 'high' | 'medium' | 'low'
  tokensUsed?: number
}

/** Enrich a pre-parsed product with LLM-extracted metadata (tags, amenities, dietary, price_model).
 *  Uses Sonnet for quality — enrichment is one-time, high-stakes. */
export async function enrichProduct(
  preParsed: Partial<EnrichedProduct> & { source_hash: string },
  extract: typeof extractStructuredSonnet = extractStructuredSonnet,
): Promise<EnrichmentResult> {
  const prompt = `${FEW_SHOT}

Now extract metadata for this product:
Title: "${preParsed.title}"
Description: "${preParsed.description}"
Pre-parsed: category=${preParsed.category}, subtype=${preParsed.subtype}, capacity_max=${preParsed.capacity_max}, indoor_outdoor=${preParsed.indoor_outdoor}, unit=${preParsed.unit}

Return JSON only.`

  const result = await extract(prompt, EnrichmentOutput, SYSTEM_PROMPT)

  // Apply overrides only if LLM flagged them
  const category = (result.category_override as EnrichedProduct['category']) ?? preParsed.category!
  const capacityMax = result.capacity_max_override ?? preParsed.capacity_max!
  const indoorOutdoor = result.indoor_outdoor_override ?? preParsed.indoor_outdoor!

  // Determine confidence based on whether overrides were needed
  const hasOverrides = result.category_override || result.capacity_max_override || result.indoor_outdoor_override
  const confidence = hasOverrides ? 'medium' : 'high'

  const enriched = EnrichedProduct.parse({
    product_id: preParsed.product_id,
    variation_id: preParsed.variation_id,
    title: preParsed.title,
    description: preParsed.description,
    category,
    subtype: preParsed.subtype,
    capacity_min: preParsed.capacity_min,
    capacity_max: capacityMax,
    unit: preParsed.unit,
    price_model: result.price_model,
    price_cents: preParsed.price_cents,
    currency: preParsed.currency,
    tags: result.tags,
    amenities: result.amenities,
    dietary_options: result.dietary_options,
    indoor_outdoor: indoorOutdoor,
    retrieval_text: '', // placeholder, built in next step
  })

  return { product: enriched, confidence }
}
