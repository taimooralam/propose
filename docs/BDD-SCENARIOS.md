# BDD Scenarios

## Purpose

These scenarios define the externally visible behavior that the first implementation slices must satisfy.

## Scenario 1: Simple Meeting With Full Coverage

**Given** a seeded catalog with a boardroom, lunch package, coffee service, and projector package
**When** an RFP requests a 12-person full-day board meeting with lunch, coffee, and projector support
**Then** the system extracts the expected slots
**And** returns at least one valid candidate for each slot
**And** reports full coverage

## Scenario 2: Multi-Slot Event With Parallel Needs

**Given** a seeded catalog with a main venue, breakout rooms, catering options, WiFi, and registration support
**When** an RFP requests a two-day event with parallel room usage and multiple catering requirements
**Then** the system extracts separate slots for each distinct requirement
**And** matching is performed per slot rather than as one global query
**And** the response includes ranked candidates per slot

## Scenario 3: Hard Constraint Rejection

**Given** a seeded catalog where no venue supports the required guest count
**When** an RFP requests a venue above the supported capacity
**Then** the system does not return invalid matches as covered
**And** the gap is surfaced explicitly in the coverage report

## Scenario 4: Invalid Input Handling

**Given** an empty or malformed RFP request
**When** the request is submitted
**Then** validation fails at the boundary
**And** the pipeline does not attempt retrieval or generation

## Scenario 5: Gap Recovery Attempt

**Given** a seeded catalog where a strict query yields no match for one slot
**When** the slot is eligible for soft-constraint relaxation
**Then** the system retries only that missing slot
**And** reports whether coverage improved or the gap remains
