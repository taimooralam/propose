import { describe, it, expect } from 'vitest'
import { matchSlot } from '@/server/retrieval/match-slots'
import type { RequirementSlot } from '@/schemas'
import {
  testCatalog,
  boardroomAlpha,
  ballroomMeridian,
  gardenTerrace,
  executiveLunchBuffet,
  basicProjectorKit,
} from '../fixtures/catalog'

describe('matchSlot — category filtering', () => {
  it('catering slot does not match AV products', async () => {
    const slot: RequirementSlot = {
      type: 'catering',
      context: 'lunch for 12',
      guests: 12,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const categories = result.candidates.map(c => c.product.category)

    expect(categories.every(c => c === 'catering')).toBe(true)
  })

  it('venue slot does not return accommodation products', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'large event hall',
      capacity: 100,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const categories = result.candidates.map(c => c.product.category)

    expect(categories.every(c => c === 'venue')).toBe(true)
  })
})

describe('matchSlot — capacity filtering', () => {
  it('rejects venue with insufficient capacity', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'large conference for 50 people',
      capacity: 50,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    // boardroomAlpha (cap 16) should be excluded
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).not.toContain(boardroomAlpha.product_id)
  })

  it('returns covered=false with capacity_exceeded when no venue fits', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'mega event for 500 guests',
      capacity: 500,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    expect(result.covered).toBe(false)
    expect(result.gap_reason).toBe('capacity_exceeded')
    expect(result.candidates).toHaveLength(0)
  })
})

describe('matchSlot — indoor/outdoor filtering', () => {
  it('indoor-only slot rejects outdoor venue', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'indoor reception',
      capacity: 60,
      indoor_outdoor: 'indoor',
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).not.toContain(gardenTerrace.product_id)
  })
})

describe('matchSlot — ranking', () => {
  it('returns up to 3 candidates per slot', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'event space',
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    expect(result.candidates.length).toBeLessThanOrEqual(3)
  })

  it('boardroom ranks above ballroom for 12-person board meeting', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'boardroom for 12-person board meeting with projector',
      capacity: 12,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    expect(result.candidates.length).toBeGreaterThanOrEqual(2)

    const topCandidate = result.candidates[0]
    expect(topCandidate.product.product_id).toBe(boardroomAlpha.product_id)
  })

  it('candidates are sorted by descending similarity', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'event space for presentation',
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const scores = result.candidates.map(c => c.similarity)

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i])
    }
  })
})

describe('matchSlot — no match', () => {
  it('returns covered=false with no_category_match when category has no products', async () => {
    const slot: RequirementSlot = {
      type: 'entertainment',
      context: 'live band for dinner',
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    expect(result.covered).toBe(false)
    expect(result.gap_reason).toBe('no_category_match')
  })
})
