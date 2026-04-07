import { z } from 'zod'
import { RequirementSlot } from './slot'
import { EnrichedProduct } from './product'

export const RankedCandidate = z.object({
  product: EnrichedProduct,
  similarity: z.number(),
})

export type RankedCandidate = z.infer<typeof RankedCandidate>

export const GapReason = z.enum([
  'no_category_match',
  'capacity_exceeded',
  'budget_exceeded',
  'no_candidates_after_relaxation',
  'indoor_outdoor_mismatch',
  'other',
])

export type GapReason = z.infer<typeof GapReason>

export const SlotMatch = z.object({
  slot: RequirementSlot,
  candidates: z.array(RankedCandidate),
  covered: z.boolean(),
  gap_reason: GapReason.optional(),
  gap_detail: z.string().optional(),
  relaxed: z.boolean().default(false),
})

export type SlotMatch = z.infer<typeof SlotMatch>

export const CoverageReport = z.object({
  total_slots: z.number().int().nonnegative(),
  covered_slots: z.number().int().nonnegative(),
  coverage_ratio: z.number().min(0).max(1),
  gaps: z.array(z.object({
    slot_context: z.string(),
    reason: GapReason,
    detail: z.string().optional(),
  })),
  matches: z.array(SlotMatch),
})

export type CoverageReport = z.infer<typeof CoverageReport>
