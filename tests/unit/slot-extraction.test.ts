import { describe, it, expect } from 'vitest'
import { extractSlots } from '@/server/retrieval/extract-slots'
import { SlotType } from '@/schemas'
import { simpleRfp, mediumRfp, complexRfp } from '../fixtures/rfps'
import { simpleExpectedSlotTypes, mediumExpectedSlotTypes, complexExpectedSlotTypes } from '../fixtures/slots'

describe('extractSlots', () => {
  it('extracts exactly 4 slots from simple board meeting RFP', async () => {
    const slots = await extractSlots(simpleRfp)
    expect(slots).toHaveLength(4)

    const types = slots.map(s => s.type).sort()
    const expected = [...simpleExpectedSlotTypes].sort()
    expect(types).toEqual(expected)
  })

  it('extracts at least 8 slots from medium product launch RFP', async () => {
    const slots = await extractSlots(mediumRfp)
    expect(slots.length).toBeGreaterThanOrEqual(8)

    const types = slots.map(s => s.type)
    for (const expectedType of mediumExpectedSlotTypes) {
      expect(types).toContain(expectedType)
    }
  })

  it('extracts at least 12 slots from complex wedding RFP', async () => {
    const slots = await extractSlots(complexRfp)
    expect(slots.length).toBeGreaterThanOrEqual(12)

    const types = slots.map(s => s.type)
    for (const expectedType of complexExpectedSlotTypes) {
      expect(types).toContain(expectedType)
    }
  })

  it('normalizes aliases to valid SlotType values', async () => {
    const aliasRfp = 'We need a conference room with AV equipment and a buffet lunch for 20 people.'
    const slots = await extractSlots(aliasRfp)

    const types = slots.map(s => s.type)
    expect(types).toContain('venue')
    expect(types).toContain('av_equipment')
    expect(types).toContain('catering')
  })

  it('all extracted slots have valid SlotType', async () => {
    const slots = await extractSlots(simpleRfp)
    const validTypes = SlotType.options

    for (const slot of slots) {
      expect(validTypes).toContain(slot.type)
    }
  })

  it('extracts capacity from RFP text', async () => {
    const slots = await extractSlots(simpleRfp)
    const venueSlot = slots.find(s => s.type === 'venue')

    expect(venueSlot).toBeDefined()
    expect(venueSlot!.capacity ?? venueSlot!.guests).toBe(12)
  })
})
