import { z } from 'zod'

export const ReviewFinding = z.object({
  severity: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['missing_requirement', 'mismatched_detail', 'unaddressed_gap', 'quality']),
  description: z.string(),
})

export type ReviewFinding = z.infer<typeof ReviewFinding>

export const ProposalReview = z.object({
  summary: z.string(),
  findings: z.array(ReviewFinding),
  requirements_met: z.number().min(0).max(1),
  overall_quality: z.enum(['excellent', 'good', 'adequate', 'poor']),
})

export type ProposalReview = z.infer<typeof ProposalReview>
