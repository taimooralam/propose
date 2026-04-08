import { z } from 'zod'

const ratio = z.number().min(0).max(1)

export const EvalFlag = z.enum([
  'missing_slot_coverage',
  'capacity_violation',
  'budget_exceeded',
  'date_missing',
  'guest_count_mismatch',
  'incoherent_block',
  'constraint_violation',
])

export type EvalFlag = z.infer<typeof EvalFlag>

export const EvalResult = z.object({
  slot_recall: ratio,
  recall_k: z.number().int().positive().default(3),
  full_coverage: ratio,
  constraint_violation_rate: ratio,
  coherence: ratio,
  overall: ratio,
  dimensions: z.record(z.string(), ratio),
  flags: z.array(EvalFlag),
})

export type EvalResult = z.infer<typeof EvalResult>
