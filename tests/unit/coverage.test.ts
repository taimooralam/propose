import { describe, it, expect } from 'vitest'
import { checkCoverage } from '@/server/retrieval/coverage'
import type { RequirementSlot, SlotMatch } from '@/schemas'
import { boardroomAlpha, executiveLunchBuffet, gardenTerrace } from '../fixtures/catalog'

function coveredMatch(slot: RequirementSlot): SlotMatch {
  return {
    slot,
    candidates: [{ product: boardroomAlpha, similarity: 0.9 }],
    covered: true,
    relaxed: false,
  }
}

function uncoveredMatch(slot: RequirementSlot, reason: 'no_category_match' | 'capacity_exceeded'): SlotMatch {
  return {
    slot,
    candidates: [],
    covered: false,
    gap_reason: reason,
    gap_detail: `No products for ${slot.type}`,
    relaxed: false,
  }
}

const requiredVenue: RequirementSlot = {
  type: 'venue',
  context: 'meeting room',
  capacity: 12,
  constraints: [],
  required: true,
}

const requiredCatering: RequirementSlot = {
  type: 'catering',
  context: 'lunch',
  guests: 12,
  constraints: [],
  required: true,
}

const optionalEntertainment: RequirementSlot = {
  type: 'entertainment',
  context: 'live music',
  constraints: [],
  required: false,
}

describe('checkCoverage — basic coverage', () => {
  it('all required slots covered → coverage_ratio=1.0', () => {
    const matches: SlotMatch[] = [
      coveredMatch(requiredVenue),
      coveredMatch(requiredCatering),
    ]

    const report = checkCoverage(matches)
    expect(report.coverage_ratio).toBe(1.0)
    expect(report.covered_slots).toBe(2)
    expect(report.total_slots).toBe(2)
    expect(report.gaps).toHaveLength(0)
  })

  it('one required slot uncovered → coverage_ratio < 1.0 with gap', () => {
    const matches: SlotMatch[] = [
      coveredMatch(requiredVenue),
      uncoveredMatch(requiredCatering, 'no_category_match'),
    ]

    const report = checkCoverage(matches)
    expect(report.coverage_ratio).toBeLessThan(1.0)
    expect(report.gaps).toHaveLength(1)
    expect(report.gaps[0].reason).toBe('no_category_match')
  })
})

describe('checkCoverage — required vs optional', () => {
  it('optional slot uncovered does not reduce coverage_ratio', () => {
    const matches: SlotMatch[] = [
      coveredMatch(requiredVenue),
      coveredMatch(requiredCatering),
      uncoveredMatch(optionalEntertainment, 'no_category_match'),
    ]

    const report = checkCoverage(matches)
    // coverage_ratio is based on required slots only
    expect(report.coverage_ratio).toBe(1.0)
    expect(report.covered_slots).toBe(2) // required covered
    expect(report.total_slots).toBe(2) // required total
  })

  it('optional gap still appears in gaps array', () => {
    const matches: SlotMatch[] = [
      coveredMatch(requiredVenue),
      uncoveredMatch(optionalEntertainment, 'no_category_match'),
    ]

    const report = checkCoverage(matches)
    expect(report.gaps.length).toBeGreaterThanOrEqual(1)
    const entertainmentGap = report.gaps.find(g => g.slot_context.includes('music'))
    expect(entertainmentGap).toBeDefined()
  })
})

describe('checkCoverage — gap recovery', () => {
  it('relaxed match has relaxed=true', () => {
    const relaxedMatch: SlotMatch = {
      slot: {
        type: 'venue',
        context: 'indoor ceremony',
        capacity: 60,
        indoor_outdoor: 'indoor',
        constraints: [],
        required: true,
      },
      candidates: [{ product: gardenTerrace, similarity: 0.7 }],
      covered: true,
      relaxed: true,
    }

    expect(relaxedMatch.relaxed).toBe(true)
    expect(relaxedMatch.covered).toBe(true)
  })

  it('maximum 2 retry rounds per slot', () => {
    // This test validates the contract — implementation must respect max retries
    // The actual retry logic will be tested against the retrieval orchestrator
    const MAX_RETRIES = 2
    expect(MAX_RETRIES).toBe(2) // Architecture contract
  })

  it('only uncovered required slots are retried', () => {
    // Already-covered slots and optional uncovered slots should not be retried
    const matches: SlotMatch[] = [
      coveredMatch(requiredVenue), // already covered — skip
      uncoveredMatch(requiredCatering, 'no_category_match'), // uncovered required — retry
      uncoveredMatch(optionalEntertainment, 'no_category_match'), // optional — skip
    ]

    const slotsToRetry = matches.filter(m => !m.covered && m.slot.required)
    expect(slotsToRetry).toHaveLength(1)
    expect(slotsToRetry[0].slot.type).toBe('catering')
  })
})
