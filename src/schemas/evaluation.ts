import { z } from 'zod'

const ratio = z.number().min(0).max(1)

export const EvalResult = z.object({
  slot_recall: ratio,
  full_coverage: ratio,
  constraint_violation_rate: ratio,
  coherence: ratio,
  overall: ratio,
  dimensions: z.record(z.string(), ratio),
  flags: z.array(z.string()),
})

export type EvalResult = z.infer<typeof EvalResult>
