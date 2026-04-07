import { z } from 'zod'

const envSchema = z.object({
  PROPOSALES_API_KEY: z.string().min(1),
  PROPOSALES_COMPANY_ID: z.string().min(1).default('5265'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)
