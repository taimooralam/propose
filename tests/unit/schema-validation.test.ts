import { describe, it, expect } from 'vitest'
import { RfpInput, BudgetHint, RequirementSlot, EnrichedProduct, EvalResult } from '@/schemas'

describe('RfpInput validation', () => {
  it('accepts valid input', () => {
    expect(() => RfpInput.parse({ text: 'A valid RFP request text' })).not.toThrow()
  })

  it('rejects text shorter than 10 characters', () => {
    expect(() => RfpInput.parse({ text: 'short' })).toThrow()
  })

  it('rejects missing text field', () => {
    expect(() => RfpInput.parse({})).toThrow()
  })

  it('rejects invalid UUID', () => {
    expect(() => RfpInput.parse({ text: 'A valid RFP request', id: 'not-a-uuid' })).toThrow()
  })

  it('accepts valid UUID', () => {
    expect(() => RfpInput.parse({
      text: 'A valid RFP request',
      id: '550e8400-e29b-41d4-a716-446655440000',
    })).not.toThrow()
  })
})

describe('BudgetHint validation', () => {
  it('accepts valid budget', () => {
    expect(() => BudgetHint.parse({ amount_cents: 200000, currency: 'EUR' })).not.toThrow()
  })

  it('rejects negative amount_cents', () => {
    expect(() => BudgetHint.parse({ amount_cents: -100, currency: 'EUR' })).toThrow()
  })

  it('rejects non-integer cents', () => {
    expect(() => BudgetHint.parse({ amount_cents: 99.5, currency: 'EUR' })).toThrow()
  })

  it('rejects currency not exactly 3 characters', () => {
    expect(() => BudgetHint.parse({ amount_cents: 100, currency: 'EURO' })).toThrow()
    expect(() => BudgetHint.parse({ amount_cents: 100, currency: 'EU' })).toThrow()
  })
})

describe('RequirementSlot validation', () => {
  it('accepts valid slot', () => {
    const result = RequirementSlot.parse({
      type: 'venue',
      context: 'boardroom for 12',
    })
    expect(result.required).toBe(true) // default
    expect(result.constraints).toEqual([]) // default
  })

  it('rejects invalid SlotType', () => {
    expect(() => RequirementSlot.parse({
      type: 'invalid_type',
      context: 'something',
    })).toThrow()
  })

  it('rejects negative capacity', () => {
    expect(() => RequirementSlot.parse({
      type: 'venue',
      context: 'a room',
      capacity: -5,
    })).toThrow()
  })

  it('rejects zero capacity (must be positive)', () => {
    expect(() => RequirementSlot.parse({
      type: 'venue',
      context: 'a room',
      capacity: 0,
    })).toThrow()
  })
})

describe('EnrichedProduct validation', () => {
  const validProduct = {
    product_id: 1,
    variation_id: 1,
    title: 'Test Product',
    category: 'venue' as const,
    retrieval_text: 'Test Product | venue',
  }

  it('accepts valid product with defaults', () => {
    const result = EnrichedProduct.parse(validProduct)
    expect(result.capacity_min).toBe(0)
    expect(result.capacity_max).toBe(9999)
    expect(result.unit).toBe('flat')
    expect(result.indoor_outdoor).toBe('n/a')
  })

  it('rejects non-positive product_id', () => {
    expect(() => EnrichedProduct.parse({ ...validProduct, product_id: 0 })).toThrow()
    expect(() => EnrichedProduct.parse({ ...validProduct, product_id: -1 })).toThrow()
  })

  it('rejects missing retrieval_text', () => {
    const { retrieval_text, ...noText } = validProduct
    expect(() => EnrichedProduct.parse(noText)).toThrow()
  })
})

describe('EvalResult validation', () => {
  const validEval = {
    slot_recall: 0.8,
    recall_k: 3,
    full_coverage: 1.0,
    constraint_violation_rate: 0.0,
    coherence: 0.9,
    overall: 0.85,
    dimensions: { relevance: 0.9 },
    flags: [],
  }

  it('accepts valid result', () => {
    expect(() => EvalResult.parse(validEval)).not.toThrow()
  })

  it('rejects value greater than 1', () => {
    expect(() => EvalResult.parse({ ...validEval, slot_recall: 1.5 })).toThrow()
  })

  it('rejects value less than 0', () => {
    expect(() => EvalResult.parse({ ...validEval, coherence: -0.1 })).toThrow()
  })

  it('rejects invalid flag', () => {
    expect(() => EvalResult.parse({ ...validEval, flags: ['not_a_real_flag'] })).toThrow()
  })
})
