import { describe, it, expect, vi } from 'vitest'
import { extractSlots } from '@/server/retrieval/extract-slots'
import { SlotType } from '@/schemas'
import { simpleRfp, mediumRfp } from '../fixtures/rfps'

// Stub the AI client so tests don't call Haiku
const mockExtract = vi.fn()

// Stubbed Haiku responses for deterministic testing
const simpleResponse = {
  slots: [
    { type: 'venue', context: 'boardroom for 12-person board meeting', capacity: 12, required: true, constraints: [] },
    { type: 'catering', context: 'lunch for 12 attendees', guests: 12, required: true, constraints: [] },
    { type: 'catering', context: 'coffee and refreshments', guests: 12, required: true, constraints: [] },
    { type: 'av_equipment', context: 'projector with screen for presentation', required: true, constraints: [] },
  ],
}

const mediumResponse = {
  slots: [
    { type: 'venue', context: 'main venue for 80 guests theater-style', capacity: 80, required: true, constraints: [] },
    { type: 'venue', context: 'breakout room 1 for 25 people', capacity: 25, required: true, constraints: [] },
    { type: 'venue', context: 'breakout room 2 for 25 people', capacity: 25, required: true, constraints: [] },
    { type: 'catering', context: 'full lunch buffet for 80 guests', guests: 80, required: true, constraints: [] },
    { type: 'catering', context: 'continuous coffee service', guests: 80, required: true, constraints: [] },
    { type: 'av_equipment', context: 'full AV package with sound and screens', required: true, constraints: [] },
    { type: 'service', context: 'high-speed WiFi', required: true, constraints: [] },
    { type: 'service', context: 'registration desk with check-in staff', required: true, constraints: [] },
  ],
}

const aliasResponse = {
  slots: [
    { type: 'venue', context: 'conference room for 20 people', capacity: 20, required: true, constraints: [] },
    { type: 'av_equipment', context: 'AV equipment for presentation', required: true, constraints: [] },
    { type: 'catering', context: 'buffet lunch for 20 people', guests: 20, required: true, constraints: [] },
  ],
}

describe('extractSlots', () => {
  it('extracts exactly 4 slots from simple board meeting RFP', async () => {
    mockExtract.mockResolvedValueOnce(simpleResponse)
    const slots = await extractSlots(simpleRfp, mockExtract)
    expect(slots).toHaveLength(4)

    const types = slots.map(s => s.type).sort()
    expect(types).toEqual(['av_equipment', 'catering', 'catering', 'venue'])
  })

  it('extracts at least 8 slots from medium product launch RFP', async () => {
    mockExtract.mockResolvedValueOnce(mediumResponse)
    const slots = await extractSlots(mediumRfp, mockExtract)
    expect(slots.length).toBeGreaterThanOrEqual(8)

    const types = slots.map(s => s.type)
    expect(types).toContain('venue')
    expect(types).toContain('catering')
    expect(types).toContain('av_equipment')
    expect(types).toContain('service')
  })

  it('normalizes aliases to valid SlotType values', async () => {
    mockExtract.mockResolvedValueOnce(aliasResponse)
    const aliasRfp = 'We need a conference room with AV equipment and a buffet lunch for 20 people.'
    const slots = await extractSlots(aliasRfp, mockExtract)

    const types = slots.map(s => s.type)
    expect(types).toContain('venue')
    expect(types).toContain('av_equipment')
    expect(types).toContain('catering')
  })

  it('all extracted slots have valid SlotType', async () => {
    mockExtract.mockResolvedValueOnce(simpleResponse)
    const slots = await extractSlots(simpleRfp, mockExtract)
    const validTypes = SlotType.options

    for (const slot of slots) {
      expect(validTypes).toContain(slot.type)
    }
  })

  it('extracts capacity from RFP text', async () => {
    mockExtract.mockResolvedValueOnce(simpleResponse)
    const slots = await extractSlots(simpleRfp, mockExtract)
    const venueSlot = slots.find(s => s.type === 'venue')

    expect(venueSlot).toBeDefined()
    expect(venueSlot!.capacity ?? venueSlot!.guests).toBe(12)
  })
})
