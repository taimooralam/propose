import { z } from 'zod'

export const RfpInput = z.object({
  text: z.string().min(10),
  id: z.string().uuid().optional(),
})

export type RfpInput = z.infer<typeof RfpInput>
