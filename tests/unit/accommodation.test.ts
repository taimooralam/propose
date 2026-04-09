import { describe, it, expect } from 'vitest'
import { matchSlot } from '@/server/retrieval/match-slots'
import type { RequirementSlot } from '@/schemas'
import { testCatalog, standardRoomBlock, ballroomMeridian } from '../fixtures/catalog'

const noopEmbed = async () => [] as number[]

describe('accommodation — room count semantics', () => {
  it('accommodation slot uses rooms for filtering, not guests', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '15 hotel rooms for 2 nights',
      rooms: 15,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog, noopEmbed)
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

    const result = await matchSlot(slot, testCatalog, noopEmbed)
    const categories = result.candidates.map(c => c.product.category)
    expect(categories.every(c => c === 'accommodation')).toBe(true)
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

    const result = await matchSlot(slot, testCatalog, noopEmbed)
    const categories = result.candidates.map(c => c.product.category)
    expect(categories.every(c => c === 'venue')).toBe(true)
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).not.toContain(standardRoomBlock.product_id)
  })

  it('accommodation with guests but no rooms uses guests as fallback for capacity check', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '30 guests need rooms',
      guests: 30,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog, noopEmbed)
    // standardRoomBlock has capacity_max=40, guests=30 fits via fallback
    // Note: this is a best-effort fallback — extraction should ideally provide rooms
    expect(result.covered).toBe(true)
    const ids = result.candidates.map(c => c.product.product_id)
    expect(ids).toContain(standardRoomBlock.product_id)
  })

  it('accommodation with guests=60 but no rooms exceeds capacity via fallback', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '60 guests need rooms',
      guests: 60,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog, noopEmbed)
    // standardRoomBlock has capacity_max=40, guests=60 exceeds
    expect(result.covered).toBe(false)
    expect(result.gap_reason).toBe('capacity_exceeded')
  })

  it('room count exceeding capacity returns uncovered', async () => {
    const slot: RequirementSlot = {
      type: 'accommodation',
      context: '50 hotel rooms',
      rooms: 50,
      constraints: [],
      required: true,
    }

    const result = await matchSlot(slot, testCatalog, noopEmbed)
    expect(result.covered).toBe(false)
    expect(result.gap_reason).toBe('capacity_exceeded')
  })
})
