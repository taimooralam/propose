import { z } from 'zod'
import { RequirementSlot, SlotType, BudgetHint } from '@/schemas'
import { extractStructured } from '@/server/clients/ai'

const RawSlot = z.object({
  type: z.string(),
  context: z.string(),
  capacity: z.number().optional(),
  guests: z.number().optional(),
  rooms: z.number().optional(),
  budget_hint_cents: z.number().optional(),
  budget_currency: z.string().optional(),
  date: z.string().optional(),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both']).optional(),
  constraints: z.array(z.string()).default([]),
  required: z.boolean().default(true),
})

const ExtractionResult = z.object({
  slots: z.array(RawSlot),
})

const SYSTEM_PROMPT = `You are a hotel event requirement extractor. Given an RFP (Request for Proposal), extract every distinct requirement as a typed slot.

Rules:
- Each slot represents ONE distinct need (venue, catering, AV, etc.)
- If an event needs multiple venues (ceremony + reception), create separate slots
- If catering is needed for different meals (lunch + coffee), create separate slots
- Budget and date are FIELDS on a slot, not separate slots
- "projector and screen" is ONE av_equipment slot, not two
- Accommodation capacity is measured in ROOMS, not guests
- Set required=false only for explicit upsells or nice-to-haves

Valid slot types: venue, catering, accommodation, av_equipment, activity, decoration, entertainment, service, dietary

Return JSON: { "slots": [...] }`

const FEW_SHOT = `
Example 1 — Simple meeting:
RFP: "12-person board meeting, lunch, coffee, projector. EUR 2000."
Slots:
- {type: "venue", context: "boardroom for 12-person board meeting", capacity: 12}
- {type: "catering", context: "lunch for 12 attendees", guests: 12}
- {type: "catering", context: "coffee and refreshments", guests: 12}
- {type: "av_equipment", context: "projector with screen for presentation"}

Example 2 — Event with accommodation:
RFP: "80-guest conference, main hall + 2 breakout rooms for 25, lunch, WiFi, 15 hotel rooms"
Slots:
- {type: "venue", context: "main conference hall for 80 guests theater-style", capacity: 80}
- {type: "venue", context: "breakout room 1 for 25 people", capacity: 25}
- {type: "venue", context: "breakout room 2 for 25 people", capacity: 25}
- {type: "catering", context: "lunch for 80 guests", guests: 80}
- {type: "service", context: "high-speed WiFi for event"}
- {type: "accommodation", context: "15 hotel rooms", rooms: 15}
`

/** Normalize a raw slot type string to a valid SlotType enum value. */
function normalizeSlotType(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z_]/g, '')
  const aliases: Record<string, string> = {
    'venue': 'venue',
    'room': 'venue',
    'hall': 'venue',
    'catering': 'catering',
    'food': 'catering',
    'beverage': 'catering',
    'accommodation': 'accommodation',
    'hotel': 'accommodation',
    'lodging': 'accommodation',
    'av_equipment': 'av_equipment',
    'av': 'av_equipment',
    'audio_visual': 'av_equipment',
    'activity': 'activity',
    'entertainment': 'entertainment',
    'decoration': 'decoration',
    'service': 'service',
    'dietary': 'dietary',
  }
  return aliases[lower] ?? lower
}

/** Extract requirement slots from RFP text. Uses Haiku for LLM extraction. */
export async function extractSlots(
  rfp: string,
  extract: typeof extractStructured = extractStructured,
): Promise<RequirementSlot[]> {
  const prompt = `${FEW_SHOT}\n\nNow extract slots from this RFP:\n\n${rfp}`

  const result = await extract(prompt, ExtractionResult, SYSTEM_PROMPT)

  return result.slots
    .map(raw => {
      const normalizedType = normalizeSlotType(raw.type)
      const typeResult = SlotType.safeParse(normalizedType)
      if (!typeResult.success) return null

      const slot: Record<string, unknown> = {
        type: typeResult.data,
        context: raw.context,
        constraints: raw.constraints,
        required: raw.required,
      }

      if (raw.capacity !== undefined) slot.capacity = raw.capacity
      if (raw.guests !== undefined) slot.guests = raw.guests
      if (raw.rooms !== undefined) slot.rooms = raw.rooms
      if (raw.date !== undefined) slot.date = raw.date
      if (raw.indoor_outdoor !== undefined) slot.indoor_outdoor = raw.indoor_outdoor

      if (raw.budget_hint_cents !== undefined) {
        slot.budget_hint = {
          amount_cents: raw.budget_hint_cents,
          currency: raw.budget_currency ?? 'EUR',
        }
      }

      return RequirementSlot.parse(slot)
    })
    .filter((s): s is RequirementSlot => s !== null)
}
