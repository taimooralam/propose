# Implementation Roadmap

## Goal

Set up the project in the right order so that architecture, tests, dataset understanding, and implementation reinforce each other instead of competing with each other.

## Prioritization Rule

The correct order is:

1. repo rules
2. runtime and test bootstrap
3. dataset exploration
4. domain contracts
5. architecture and BDD scenarios
6. retrieval vertical slice
7. proposal pipeline
8. evaluation
9. review and documentation checks

This order matters because the main project risk is choosing the wrong retrieval model for the actual product data. That risk is reduced by exploring the dataset and locking the contracts before building the pipeline.

## Phase 0: Operating Model

Create and align these first:

- `AGENTS.md`
- `CLAUDE.md`
- branch naming
- definition of done
- review gates

Deliverables:

- shared agent instructions
- short-lived branch strategy
- clear build order

## Phase 1: Bootstrap the App and Test Harness

Do this before any domain code:

- scaffold Next.js App Router
- add strict TypeScript
- add `zod`
- add `vitest`
- add `.env.example`
- add path aliases
- add a minimal `README.md`

Keep the bootstrap lean. Do not add background-job infrastructure, vector databases, or provider abstractions beyond what the first vertical slice needs.

## Phase 2: Explore the Dataset and API Shape

Do not guess the catalog model from intuition alone.

Explore:

- actual product payload shape
- title and description patterns
- pricing representation
- capacity phrasing
- amenity phrasing
- category ambiguity
- missing metadata that must be inferred

Outputs:

- field inventory
- enrichment schema draft
- category taxonomy
- alias map
- hard constraints list

Stop here and update the architecture if exploration disproves an assumption.

## Phase 3: Lock the Domain Model

Use DDD lightly. The point is clear boundaries, not ceremony.

Bounded contexts:

- catalog
- retrieval
- proposal
- evaluation
- run orchestration

Create the shared contracts first:

- `RfpInput`
- `RequirementSlot`
- `EnrichedProduct`
- `SlotMatch`
- `CoverageReport`
- `ProposalPlan`
- `EvalResult`
- `PipelineRun`

## Phase 4: Write the Initial Architecture

Write `docs/ARCHITECTURE.md` before major feature work.

It should answer:

- why the system is slot-based rather than whole-query retrieval
- what the runtime boundaries are
- what the ingestion path produces
- how retrieval works
- how coverage is measured
- what scales later and what does not

Keep it current. If code contradicts the architecture, either the code or the document is wrong.

## Phase 5: BDD First, Then TDD

BDD should define behavior at the slice level.

Start with these scenarios:

- simple meeting request with full coverage
- multi-slot event request with parallel room and catering needs
- request with impossible constraints that must produce gaps
- invalid RFP input that must fail validation

Then convert the scenarios into:

- unit tests for parsing, matching, and scoring
- integration tests for end-to-end retrieval behavior

## Phase 6: Build the First Vertical Slice

This is the first real implementation target:

1. ingest or load seed products
2. enrich into structured product data
3. extract slots from RFP text
4. filter by hard constraints
5. rank by dense similarity
6. report coverage and gaps

This slice proves the core architecture. Do not start proposal generation until this works.

## Phase 7: Add Proposal Planning and Generation

After retrieval is stable:

- create proposal plan from matched slots
- generate content blocks
- assemble proposal payloads through the API
- add self-review

This phase should reuse retrieval outputs rather than re-infer the world from scratch.

## Phase 8: Add Evaluation and Review Loops

Center evaluation on the actual problem:

- slot recall
- full coverage
- hard-constraint violations
- coherence
- latency
- token cost

Add review loops at each stage rather than only at the end.

## Phase 9: Documentation and Release Checks

Before merging a slice or preparing a demo:

- run implementation review
- run docs consistency check
- verify env setup
- verify architecture still matches behavior
- verify the public AI log stays sanitized

## Branching Mechanism

Use short-lived branches with one purpose per branch.

- `docs/setup-foundation`
- `feat/contracts-and-tests`
- `feat/retrieval-core`
- `feat/proposal-pipeline`
- `feat/evaluation`
- `fix/<topic>`
- `spike/<topic>`

Recommended merge order:

1. `docs/setup-foundation`
2. `feat/bootstrap-runtime`
3. `feat/contracts-and-tests`
4. `feat/retrieval-core`
5. `feat/proposal-pipeline`
6. `feat/evaluation`

## Subagents and Skills

Do not overbuild custom skills on day zero. Use a two-step approach.

Step 1:

- define roles in `AGENTS.md`
- use them manually through focused prompts

Step 2:

- promote recurring roles into reusable skills once the workflow stabilizes

Promote these first:

- dataset explorer
- contract writer
- coverage writer
- reviewer
- documentation checker

## Realistic SDLC Checkpoints

Use targeted review prompts at the right time.

Before implementation:

- architecture challenge
- dataset/schema challenge

During implementation:

- test gap check
- retrieval logic review

Before merge:

- regression and failure-mode review
- docs consistency review

## What Not to Do Yet

Do not start with:

- a vector database
- background jobs
- UI polish
- package splitting
- generic agent frameworks
- speculative abstractions for scale that the first slice does not use

## Immediate Next Steps

1. Scaffold the actual app and test harness.
2. Pull or mock a representative product dataset.
3. Write the shared schemas.
4. Write the BDD scenarios and first tests.
5. Implement retrieval only.
