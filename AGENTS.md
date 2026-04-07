# AGENTS.md

This file is the shared operating contract for all AI agents working in this repository.

If `CLAUDE.md` or a future tool-specific file adds detail, it should follow this document. For repo policy, architecture direction, workflow, and review gates, `AGENTS.md` is the source of truth.

## Mission

Build an AI Proposal Intelligence System that turns unstructured RFPs into structured proposal outputs through:

- enrichment-first ingestion
- slot-based retrieval
- proposal planning and generation
- explicit evaluation

This is not flat-document RAG. The retrieval unit is:

`RFP -> requirement slots -> candidates per slot -> coverage check`

## Outcome Priorities

1. Produce a working vertical slice before building supporting abstractions.
2. Keep architecture and code aligned through shared schemas and tests.
3. Make retrieval quality explainable through coverage-oriented evaluation.
4. Keep the public documentation clean and the private `raw/` material unshipped.

## Delivery Principles

- Architecture first, but only to the level needed to unblock implementation.
- BDD at workflow boundaries, TDD inside modules.
- DDD-lite, not heavyweight DDD.
- Functional TypeScript with explicit inputs and outputs.
- Zod at every data boundary.
- Prefer one clear app over premature monorepo structure.
- Prefer simple synchronous flows first; add async orchestration only when latency or deployment constraints force it.
- Keep AI usage explicit: extraction, enrichment, generation, review, evaluation.

## DDD-Lite Boundaries

Use bounded contexts to keep the codebase legible, but do not add heavy domain machinery.

- `catalog`
  Product seed data, enrichment, embeddings, retrieval text, storage.
- `retrieval`
  Slot extraction, normalization, filtering, ranking, coverage checks.
- `proposal`
  Proposal planning, content generation, assembly through the API.
- `evaluation`
  Slot recall, coverage, constraint validation, coherence checks.
- `run orchestration`
  Pipeline status, stage transitions, result persistence, API routes.

Shared value objects should stay in `src/schemas/` and drive both tests and implementation.

## BDD and TDD Rules

- Write BDD scenarios before implementing a feature slice.
- Keep BDD focused on externally visible behavior, not internal function names.
- Convert each scenario into unit and integration tests before implementation.
- Start with the simple path, then add edge cases, then add failure handling.

Minimum scenario families:

- simple RFP with full coverage
- multi-slot RFP with parallel requirements
- hard-constraint rejection
- gap reporting when no valid product exists
- invalid input handling

## Architecture and Pattern Rules

Prefer these patterns:

- ports and adapters for API clients and storage
- pure-function pipelines for retrieval and scoring
- schema-first contracts with Zod
- explicit stage-based orchestration
- fixture-driven tests

Avoid these patterns:

- classes for workflow orchestration
- ORM-driven domain logic
- speculative package boundaries
- agent loops where deterministic steps are enough
- hidden mutable state

## Initial Technology Choices

Choose the smallest stack that still looks production-aware.

- app/runtime: Next.js App Router + TypeScript
- package manager: `pnpm`
- validation/contracts: `zod`
- testing: `vitest` + Testing Library where UI exists
- embeddings: OpenAI `text-embedding-3-small`
- extraction/generation/eval: Anthropic Haiku for structured extraction, Sonnet for generation and rubric-based review
- API layer: typed fetch client for Proposales v3
- local seed/bootstrap: JSON fixtures under `data/seed/`
- initial retrieval store: in-memory or local fixture-backed store behind an interface
- scale-ready store later: Postgres or KV-backed catalog store
- deployment target: Vercel

Do not start with:

- Trigger.dev
- a vector database
- a monorepo
- multi-tenant persistence

Those belong after the first vertical slice is working.

## Recommended Build Order

1. Align agent behavior and repo rules.
2. Bootstrap runtime, tests, env handling, and path aliases.
3. Explore the product dataset and API shape before writing retrieval code.
4. Lock the ubiquitous language and shared schemas.
5. Write the initial architecture and BDD scenarios.
6. Implement retrieval as the first vertical slice.
7. Add proposal planning and generation.
8. Add evaluation and review loops.
9. Tighten docs, review gates, and deployment.

## Dataset Exploration Rules

Do dataset exploration before retrieval implementation. The goal is to learn what can be filtered deterministically and what must be inferred.

Answer these questions first:

- What fields exist natively in the API payload?
- Which retrieval-critical fields are missing?
- Which product categories appear in practice?
- How are capacity, pricing, and amenities expressed in raw descriptions?
- Which aliases or synonyms appear across products?
- Which hard constraints can be normalized reliably?

Expected output from dataset exploration:

- a field inventory
- a proposed enrichment schema
- category and subtype taxonomy
- retrieval text composition rules
- normalization rules for capacity, pricing, and amenities

## Branching Strategy

Use short-lived branches and small merges.

- `main`
  Always releasable.
- `feat/<slice>`
  New feature slices such as `feat/retrieval-core`.
- `fix/<topic>`
  Bug fixes.
- `docs/<topic>`
  Docs-only changes.
- `spike/<topic>`
  Time-boxed exploration. No production assumptions until findings are written down.

Branch rules:

- One vertical slice per branch.
- Do not mix architecture refactors with feature work unless the refactor is required for the slice.
- Merge only after tests and review gates pass.
- Prefer atomic commits that map to one intent.

## Agent Roles

Define roles here first. Promote them into reusable skills only after they prove useful more than once.

### Architect

Owns:

- `docs/ARCHITECTURE.md`
- boundary decisions
- ADR-level trade-offs

Focus:

- keep control flow simple
- keep runtime boundaries explicit
- reject premature abstractions

### Dataset Explorer

Owns:

- dataset field inventory
- enrichment schema proposal
- taxonomy and normalization notes

Focus:

- verify assumptions from real payloads
- identify missing metadata and ambiguity

### Contract Writer

Owns:

- `src/schemas/*`
- shared types and invariants

Focus:

- model the domain through explicit contracts
- push ambiguity to the edges

### Retrieval Implementer

Owns:

- slot extraction
- matching
- coverage and gap handling

Focus:

- hard constraints first
- ranking second
- explainable outputs

### Coverage Writer

Owns:

- test additions around changed modules
- missing edge-case detection

Focus:

- invalid input
- boundary conditions
- regressions in ranking and coverage logic

### Reviewer

Owns:

- bug-finding
- security and server/client boundary review
- architecture consistency review

Focus:

- failure modes
- hidden state
- data-contract drift

### Documentation Checker

Owns:

- consistency across `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, env docs, and API descriptions

Focus:

- stale instructions
- mismatch between code paths and docs
- missing setup steps

## Review Gates

Run these checks at the right phase instead of waiting until the end.

### Gate 1: Architecture Challenge

Run before major coding starts.

Prompt shape:

`Review the current architecture for boundary leaks, speculative abstraction, missing runtime constraints, and retrieval-quality risks. Prefer findings over praise.`

### Gate 2: Dataset and Schema Check

Run after dataset exploration and schema drafting.

Prompt shape:

`Review the field inventory and schemas. Identify unsupported assumptions, missing normalization rules, and fields that cannot be recovered reliably from source data.`

### Gate 3: Test Gap Check

Run after writing tests for a slice and before implementing it.

Prompt shape:

`Review the tests for this slice. Identify edge cases, invalid inputs, and domain rules that are still untested.`

### Gate 4: Implementation Risk Check

Run after a slice is coded.

Prompt shape:

`Review the diff for bugs, contract drift, prompt-injection risk, server/client boundary mistakes, and missing failure handling.`

### Gate 5: Documentation Consistency Check

Run before merge or release.

Prompt shape:

`Review docs, env requirements, architecture notes, and exposed routes for inconsistencies, stale claims, and missing operational details.`

## Definition of Done Per Slice

A slice is done only when:

- the BDD scenario is written
- schemas exist or were updated
- unit tests exist
- integration behavior is exercised where relevant
- architecture docs still match reality
- review gates are run
- the slice can be explained without referencing private notes

## First Implementation Target

The first useful vertical slice is:

1. accept RFP text
2. extract requirement slots
3. match top candidates per slot from seeded products
4. return coverage and gaps

Do not start with proposal generation. Retrieval quality is the foundation.

## Private Material

- `raw/` stays private.
- Never copy private prompt text into public docs.
- Public docs should describe engineering decisions, not planning provenance.
