import { z } from 'zod'
import { RequirementSlot } from './slot'
import { EnrichedProduct } from './product'

/** Internal proposal block used during planning/generation. */
export const ProposalBlock = z.object({
  slot: RequirementSlot,
  product: EnrichedProduct,
  content_md: z.string(),
  quantity: z.number().int().positive().default(1),
  unit_value_cents: z.number().int().nonnegative(),
})

export type ProposalBlock = z.infer<typeof ProposalBlock>

export const ProposalPlan = z.object({
  rfp_summary: z.string(),
  blocks: z.array(ProposalBlock),
  gap_notes: z.array(z.string()).default([]),
})

export type ProposalPlan = z.infer<typeof ProposalPlan>

/** Block payload shaped for the Proposales Create Proposal API. */
export const ApiProposalBlock = z.object({
  content_id: z.number().int().positive(),
  type: z.literal('product-block'),
  title: z.string().optional(),
  description: z.string().optional(),
  comment: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  unit_value_without_discount_without_tax: z.number().int().nonnegative(),
  unit_value_with_discount_without_tax: z.number().int().nonnegative(),
  unit_value_without_discount_with_tax: z.number().int().nonnegative(),
  unit_value_with_discount_with_tax: z.number().int().nonnegative(),
  currency: z.string().length(3).default('EUR'),
  optional: z.boolean().default(false),
  package_split: z.array(z.object({
    type: z.enum(['accommodation', 'meetingRoom', 'food', 'other']),
    vat: z.number().min(0).max(1),
  })).optional(),
})

export type ApiProposalBlock = z.infer<typeof ApiProposalBlock>

/** Payload for POST /v3/proposals. */
export const CreateProposalPayload = z.object({
  company_id: z.number().int().positive(),
  language: z.string().length(2).default('en'),
  title_md: z.string().optional(),
  description_md: z.string().optional(),
  blocks: z.array(ApiProposalBlock),
})

export type CreateProposalPayload = z.infer<typeof CreateProposalPayload>
