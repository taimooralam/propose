import { z } from 'zod'

export const SlotType = z.enum([
  'venue',
  'catering',
  'accommodation',
  'av_equipment',
  'activity',
  'decoration',
  'entertainment',
  'service',
  'dietary',
])

export type SlotType = z.infer<typeof SlotType>

export const BudgetHint = z.object({
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().length(3).default('EUR'),
})

export type BudgetHint = z.infer<typeof BudgetHint>

export const RequirementSlot = z.object({
  type: SlotType,
  context: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  guests: z.number().int().positive().optional(),
  rooms: z.number().int().positive().optional(),
  budget_hint: BudgetHint.optional(),
  date: z.string().optional(),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both']).optional(),
  constraints: z.array(z.string()).default([]),
  required: z.boolean().default(true),
})

export type RequirementSlot = z.infer<typeof RequirementSlot>
