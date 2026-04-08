import { describe, it, expect } from 'vitest'
import { matchSlot } from '@/server/retrieval/match-slots'
import type { RequirementSlot } from '@/schemas'
import { testCatalog, standardRoomBlock, ballroomMeridian } from '../fixtures/catalog'

describe('accommodation — room count semantics', () => {
  it('accommodation slot uses rooms for filtering, not guests', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '15 hotel rooms for 2 nights',
      rooms: 15,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    // standardRoomBlock has capacity_max=20, rooms=15 fits
    expect(result.covered).toBe(true)
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).toContain(standardRoomBlock.product_id)
  })

  it('venue products never satisfy accommodation slots', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: 'rooms for guests',
      rooms: 5,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const categories = result.candidates.map(c => c.product.category)
    expect(categories.every(c => c === 'accommodation')).toBe(true)
    // ballroom should never appear here
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).not.toContain(ballroomMeridian.product_id)
  })

  it('accommodation products never satisfy venue slots', async () => {
    const slot: RequirementSlot = {
      type: 'venue',
      context: 'event space for 100 guests',
      capacity: 100,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    const categories = result.candidates.map(c => c.product.category)
    expect(categories.every(c => c === 'venue')).toBe(true)
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).not.toContain(standardRoomBlock.product_id)
  })

  it('room count exceeding capacity returns uncovered', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '50 hotel rooms',
      rooms: 50,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog)
    // standardRoomBlock has capacity_max=20, rooms=50 exceeds
    expect(result.covered).toBe(false)
    expect(result.gap_reason).toBe('capacity_exceeded')
  })
})
