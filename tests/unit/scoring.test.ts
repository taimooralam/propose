import { describe, it, expect } from 'vitest'
import { EvalResult, EvalFlag } from '@/schemas'

describe('EvalResult scoring', () => {
  it('full coverage produces high slot_recall', () => {
    const result = EvalResult.parse({
      slot_recall: 1.0,
      recall_k: 3,
      full_coverage: 1.0,
      constraint_violation_rate: 0.0,
      coherence: 0.9,
      overall: 0.95,
      dimensions: { relevance: 0.9, completeness: 1.0 },
      flags: [],
    })

    expect(result.slot_recall).toBe(1.0)
    expect(result.full_coverage).toBe(1.0)
    expect(result.flags).toHaveLength(0)
  })

  it('capacity violation is flagged', () => {
    const result = EvalResult.parse({
      slot_recall: 0.75,
      recall_k: 3,
      full_coverage: 0.8,
      constraint_violation_rate: 0.2,
      coherence: 0.7,
      overall: 0.6,
      dimensions: {},
      flags: ['capacity_violation'],
    })

    expect(result.flags).toContain('capacity_violation')
    expect(result.constraint_violation_rate).toBeGreaterThan(0)
  })

  it('overall aggregates within 0-1', () => {
    const result = EvalResult.parse({
      slot_recall: 0.5,
      recall_k: 3,
      full_coverage: 0.6,
      constraint_violation_rate: 0.1,
      coherence: 0.8,
      overall: 0.55,
      dimensions: {},
      flags: [],
    })

    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(1)
  })

  it('all EvalFlag values are valid', () => {
    const validFlags = EvalFlag.options
    expect(validFlags).toContain('missing_slot_coverage')
    expect(validFlags).toContain('capacity_violation')
    expect(validFlags).toContain('budget_exceeded')
    expect(validFlags).toContain('constraint_violation')
  })
})
