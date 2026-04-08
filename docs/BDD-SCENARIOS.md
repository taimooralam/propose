# BDD Scenarios

## Purpose

These scenarios define the externally visible behavior that the retrieval slice must satisfy. Each scenario pins concrete slot counts, types, gap reasons, and coverage semantics so tests catch real regressions.

## Scenario 1: Simple Meeting With Full Coverage

**Given** a seeded catalog with boardroom (cap 16), lunch buffet, coffee service, and basic projector
**When** an RFP requests a 12-person full-day board meeting with lunch, coffee, and projector support
**Then** the system extracts exactly 4 slots: `venue`, `catering` (lunch), `catering` (coffee), `av_equipment`
**And** each slot has at least one valid candidate
**And** `coverage_ratio` equals `1.0`

## Scenario 2: Multi-Slot Event With Parallel Needs

**Given** a seeded catalog with ballroom (cap 180), 2 workshop rooms (cap 30 each), lunch buffet, coffee service, full AV package, WiFi, and registration desk
**When** an RFP requests an 80-guest product launch with a main venue, 2 breakout sessions (25 each), lunch, coffee, AV, WiFi, and registration
**Then** the system extracts at least 8 slots with types: `venue` (main), `venue` (breakout 1), `venue` (breakout 2), `catering` (lunch), `catering` (coffee), `av_equipment`, `service` (WiFi), `service` (registration)
**And** matching is performed independently per slot
**And** each slot includes up to 3 `RankedCandidate` entries sorted by similarity

## Scenario 3: Hard Constraint Rejection

**Given** a seeded catalog where the largest venue has `capacity_max=180`
**When** an RFP requests a venue for 500 guests
**Then** the venue slot has `covered=false`
**And** `gap_reason` is `capacity_exceeded`
**And** the candidates array is empty
**And** the gap appears in `CoverageReport.gaps` with the reason

## Scenario 4: Invalid Input Handling

**Given** the RFP validation boundary
**When** text is fewer than 10 characters → `RfpInput` parsing fails
**When** text field is missing → `RfpInput` parsing fails
**When** id is present but not a valid UUID → `RfpInput` parsing fails

## Scenario 5: Gap Recovery With Constraint Relaxation

**Given** a seeded catalog with only an outdoor garden terrace (cap 80)
**When** an RFP requests an indoor venue for 60 guests
**Then** the first matching pass finds no candidates (indoor/outdoor mismatch)
**And** the system retries with `indoor_outdoor` constraint relaxed
**And** the garden terrace is returned as a candidate
**And** `SlotMatch.relaxed` is `true`
**And** maximum 2 retry rounds are attempted per slot

## Scenario 6: Optional Slot Does Not Fail Coverage

**Given** a seeded catalog with boardroom and lunch buffet but no entertainment products
**When** an RFP requests a board meeting with lunch (required) and optional live music
**Then** the entertainment slot has `required=false` and `covered=false`
**And** `coverage_ratio` is `1.0` because only required slots count
**And** the optional gap is visible in `CoverageReport.gaps`

## Scenario 7: Accommodation Uses Room Count Not Guest Count

**Given** a seeded catalog with a ballroom (cap 180) and standard rooms (cap 20 rooms)
**When** an RFP requests a venue for 100 guests and accommodation for 15 rooms
**Then** the venue slot filters by `guests=100` against product `capacity_max`
**And** the accommodation slot filters by `rooms=15` against product `capacity_max`
**And** venue products never satisfy the accommodation slot
**And** accommodation products never satisfy the venue slot

## Scenario 8: Indoor/Outdoor Filter and Relaxation

**Given** a seeded catalog with only an outdoor garden terrace
**When** an RFP requests an indoor venue
**Then** the first pass returns no candidates (indoor/outdoor hard filter)
**And** retry step 1 drops the `indoor_outdoor` constraint
**And** the terrace is returned with `relaxed=true`
**And** `gap_reason` is not set because the slot is now covered

## Scenario 9: Alias Normalization

**Given** a seeded catalog with boardroom, projector, and lunch buffet
**When** an RFP says "conference room with AV and buffet lunch" (no canonical taxonomy words)
**Then** the system extracts slots with types: `venue`, `av_equipment`, `catering`
**And** slot types are valid `SlotType` enum values despite alias phrasing

## Scenario 10: Ranking Quality Within Slot

**Given** a seeded catalog with boardroom (cap 16, indoor, projector amenity) and ballroom (cap 180, indoor)
**When** an RFP requests a 12-person board meeting with projector
**Then** both venues pass the capacity hard filter
**And** the boardroom ranks first (higher similarity to the meeting context)
**And** candidates are sorted by descending similarity score
