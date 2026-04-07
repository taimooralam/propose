import { z } from 'zod'
import { SlotType } from './slot'

export const Unit = z.enum([
  'per_person',
  'per_day',
  'flat',
  'per_room',
  'per_hour',
])

export type Unit = z.infer<typeof Unit>

/** Raw content item as returned by the Proposales Content API. */
export const RawContent = z.object({
  product_id: z.number().int().positive(),
  variation_id: z.number().int().positive(),
  title: z.record(z.string(), z.string()),
  description: z.record(z.string(), z.string()).optional(),
  images: z.array(z.object({
    uuid: z.string(),
    url: z.string().optional(),
  })).default([]),
  language: z.string().length(2).optional(),
  created_at: z.number().optional(),
  is_archived: z.boolean().optional(),
})

export type RawContent = z.infer<typeof RawContent>

/** Enriched product for the local retrieval sidecar. */
export const EnrichedProduct = z.object({
  product_id: z.number().int().positive(),
  variation_id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().default(''),

  category: SlotType,
  subtype: z.string().optional(),
  capacity_min: z.number().int().nonnegative().default(0),
  capacity_max: z.number().int().nonnegative().default(9999),
  unit: Unit.default('flat'),
  price_model: z.string().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).default('EUR'),
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  dietary_options: z.array(z.string()).default([]),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both', 'n/a']).default('n/a'),

  retrieval_text: z.string(),
  embedding: z.array(z.number()).optional(),
})

export type EnrichedProduct = z.infer<typeof EnrichedProduct>
