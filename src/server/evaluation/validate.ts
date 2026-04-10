import type { RequirementSlot, ProposalPlan, EvalFlag } from '@/schemas'

interface ValidationResult {
  dimensions: Record<string, number>
  flags: EvalFlag[]
  notes: string[]
}

/** Check if dates from slots are reflected in proposal blocks. */
function checkDatesPresent(slots: RequirementSlot[], plan: ProposalPlan): { score: number; notes: string[] } {
  const slotsWithDates = slots.filter(s => s.date)
  if (slotsWithDates.length === 0) return { score: 1.0, notes: [] }

  const blockTexts = plan.blocks.map(b => b.content_md.toLowerCase()).join(' ')
  const notes: string[] = []
  let found = 0

  for (const slot of slotsWithDates) {
    if (slot.date && blockTexts.includes(slot.date.toLowerCase())) {
      found++
    } else {
      notes.push(`Date "${slot.date}" from ${slot.type} slot not found in proposal`)
    }
  }

  return { score: slotsWithDates.length === 0 ? 1.0 : found / slotsWithDates.length, notes }
}

/** Check if guest counts from slots match proposal block quantities. */
function checkGuestCounts(slots: RequirementSlot[], plan: ProposalPlan): { score: number; notes: string[] } {
  const notes: string[] = []
  let checked = 0
  let matched = 0

  for (const slot of slots) {
    const expected = slot.guests ?? slot.capacity ?? slot.rooms
    if (expected === undefined) continue
    checked++

    const block = plan.blocks.find(b =>
      (b.slot as { type: string }).type === slot.type &&
      (b.slot as { context: string }).context === slot.context,
    )

    if (block && block.quantity === expected) {
      matched++
    } else if (block) {
      notes.push(`${slot.type}: expected ${expected}, got ${block.quantity}`)
    } else {
      notes.push(`${slot.type}: no block found for slot "${slot.context}"`)
    }
  }

  return { score: checked === 0 ? 1.0 : matched / checked, notes }
}

/** Check if all required slots have corresponding proposal blocks. */
function checkSlotBlockCoverage(slots: RequirementSlot[], plan: ProposalPlan): { score: number; notes: string[] } {
  const required = slots.filter(s => s.required)
  const blockSlotTypes = plan.blocks.map(b => (b.slot as { type: string }).type)
  const notes: string[] = []
  let covered = 0

  for (const slot of required) {
    if (blockSlotTypes.includes(slot.type)) {
      covered++
    } else {
      notes.push(`Required ${slot.type} slot has no proposal block`)
    }
  }

  return { score: required.length === 0 ? 1.0 : covered / required.length, notes }
}

/** Run all heuristic validation checks on a proposal.
 *  These are deterministic — no LLM calls. */
export function validateProposalHeuristics(
  slots: RequirementSlot[],
  plan: ProposalPlan,
): ValidationResult {
  const dateCheck = checkDatesPresent(slots, plan)
  const guestCheck = checkGuestCounts(slots, plan)
  const coverageCheck = checkSlotBlockCoverage(slots, plan)

  const flags: EvalFlag[] = []
  if (dateCheck.score < 1.0) flags.push('date_missing')
  if (guestCheck.score < 1.0) flags.push('guest_count_mismatch')
  if (coverageCheck.score < 1.0) flags.push('missing_slot_coverage')

  return {
    dimensions: {
      date_presence: Math.round(dateCheck.score * 1000) / 1000,
      guest_count_accuracy: Math.round(guestCheck.score * 1000) / 1000,
      slot_block_coverage: Math.round(coverageCheck.score * 1000) / 1000,
    },
    flags,
    notes: [...dateCheck.notes, ...guestCheck.notes, ...coverageCheck.notes],
  }
}
