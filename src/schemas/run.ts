import { z } from 'zod'
import { RfpInput } from './rfp'
import { RequirementSlot } from './slot'
import { CoverageReport } from './match'
import { ProposalPlan } from './proposal'
import { EvalResult } from './evaluation'

export const PipelineStatus = z.enum([
  'pending',
  'extracting',
  'matching',
  'planning',
  'generating',
  'assembling',
  'reviewing',
  'evaluating',
  'complete',
  'failed',
])

export type PipelineStatus = z.infer<typeof PipelineStatus>

export const PipelineRun = z.object({
  id: z.string().uuid(),
  status: PipelineStatus,
  rfp: RfpInput,
  slots: z.array(RequirementSlot).optional(),
  coverage: CoverageReport.optional(),
  plan: ProposalPlan.optional(),
  proposal_uuid: z.string().uuid().optional(),
  evaluation: EvalResult.optional(),
  error: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type PipelineRun = z.infer<typeof PipelineRun>
