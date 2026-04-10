import { readFileSync } from 'fs'
import path from 'path'
import type { RequirementSlot, SlotType } from '@/schemas'

export interface GoldenCase {
  name: string
  description: string
  expected_slot_count: number
  expected_slot_types: SlotType[]
  minimum_coverage: number
  notes: string
}

/** Load a golden test case by name. */
export function loadGoldenCase(name: 'simple' | 'medium' | 'complex'): GoldenCase {
  const filePath = path.join(process.cwd(), 'data', 'golden', `${name}.json`)
  return JSON.parse(readFileSync(filePath, 'utf-8')) as GoldenCase
}

/** Compare extracted slots against a golden case. Returns slot recall and details. */
export function compareSlotsToGolden(
  actual: RequirementSlot[],
  golden: GoldenCase,
): { slot_recall: number; type_recall: number; missing: string[]; extra: string[]; count_match: boolean } {
  const actualTypes = actual.map(s => s.type).sort()
  const expectedTypes = [...golden.expected_slot_types].sort()

  // Count-based recall
  const countMatch = actual.length >= golden.expected_slot_count

  // Type-based recall: for each expected type, is there a matching actual slot?
  const expectedCounts: Record<string, number> = {}
  for (const t of expectedTypes) expectedCounts[t] = (expectedCounts[t] ?? 0) + 1

  const actualCounts: Record<string, number> = {}
  for (const t of actualTypes) actualCounts[t] = (actualCounts[t] ?? 0) + 1

  const missing: string[] = []
  const extra: string[] = []
  let matched = 0

  for (const [type, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = actualCounts[type] ?? 0
    if (actualCount >= expectedCount) {
      matched += expectedCount
    } else {
      matched += actualCount
      missing.push(`${type}: expected ${expectedCount}, got ${actualCount}`)
    }
  }

  for (const [type, actualCount] of Object.entries(actualCounts)) {
    const expectedCount = expectedCounts[type] ?? 0
    if (actualCount > expectedCount) {
      extra.push(`${type}: ${actualCount - expectedCount} extra`)
    }
  }

  const typeRecall = expectedTypes.length === 0 ? 1.0 : matched / expectedTypes.length
  const slotRecall = golden.expected_slot_count === 0 ? 1.0 :
    Math.min(actual.length, golden.expected_slot_count) / golden.expected_slot_count

  return {
    slot_recall: Math.round(slotRecall * 1000) / 1000,
    type_recall: Math.round(typeRecall * 1000) / 1000,
    missing,
    extra,
    count_match: countMatch,
  }
}
