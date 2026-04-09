# AI Collaboration Log

Each entry records the tool used and a sanitized paraphrase of the original query. Raw prompts are not copied into this document.

### Architecture-First Delivery Strategy — 2026-04-07

**Tool:** Claude
**Sanitized Query:** How should this project be structured so architecture, tests, and implementation stay aligned from the start?
**Context:** The project needed a delivery approach that balanced system design, testing, and implementation instead of starting with ad hoc coding against the API.
**Evolution:** Initial planning leaned toward building quickly from the API surface. That shifted to architecture-first design, shared schemas, and test-first workflows once the coupling between ingestion, retrieval, generation, and evaluation became clearer.
**Decision:** The implementation was organized around explicit phases: architecture, contracts, tests, ingestion and retrieval, proposal generation, and evaluation.
**Trade-off:** This front-loaded documentation and scaffolding work, which slowed the first visible demo but reduced rework across later pipeline stages.

### Retrieval Unit Reframing — 2026-04-07

**Tool:** Claude + Codex
**Sanitized Query:** Is hybrid retrieval actually the right fit here, or is familiarity bias pushing the design away from the real matching problem?
**Context:** The core problem was matching unstructured RFPs against a hotel product catalog spanning venues, catering, accommodation, AV, and services.
**Evolution:** The starting assumption was whole-query retrieval using a familiar hybrid-search pattern. That changed after the failure mode was reframed: the system does not need one "most similar" item, it needs coverage across multiple simultaneous requirements.
**Decision:** Retrieval was reframed as `RFP -> requirement slots -> matches per slot -> coverage check`, with slot extraction and per-slot matching as the core control flow.
**Trade-off:** The pipeline became more structured and stateful than a standard top-K retrieval setup, but it aligned better with the real coverage problem.

### Retrieval Architecture Selection — 2026-04-07

**Tool:** Codex
**Sanitized Query:** Which retrieval architecture best fits multi-requirement RFP matching across both the current catalog size and larger future catalogs?
**Context:** A broad retrieval search space had to be reduced to a design that fit the catalog shape, the matching problem, and future scale.
**Evolution:** Instead of committing early to a known pattern, 18 approaches were evaluated across foundational retrieval, advanced reranking, query decomposition, structured-semantic hybrids, agentic control flow, and evaluation-driven methods.
**Decision:** The chosen architecture was plan-and-execute retrieval built on multi-query decomposition, metadata filtering, dense ranking, query rewrite for gap recovery, and inline coverage evaluation.
**Trade-off:** Heavier options such as late-interaction models, learned sparse retrieval, and fully agentic retrieval loops were deferred because they added complexity without clear benefit for the current scope.

### Small-Catalog and Scale Strategy — 2026-04-07

**Tool:** Claude + Codex
**Sanitized Query:** How should the retrieval design change between a small typed catalog today and a much larger catalog later?
**Context:** The retrieval design had to work for a small typed catalog now and still make sense at much larger catalog sizes later.
**Evolution:** Lexical hybrid retrieval was initially treated as the default. It was then rejected for the current catalog size because it added noise, and later reintroduced as a scale-stage signal once the design was evaluated across larger corpora.
**Decision:** The current design uses metadata filtering plus dense ranking inside each slot, while lexical hybrid and reranking are reserved for larger catalogs where exact-term sensitivity becomes more valuable.
**Trade-off:** The near-term implementation is optimized for the current product set rather than for maximum generality, so larger-scale retrieval would require additional indexing and ranking layers.

### Enrichment-First Ingestion — 2026-04-07

**Tool:** Claude
**Sanitized Query:** How should ingestion work if the source content API lacks the structured fields needed for reliable filtering and matching?
**Context:** Accurate retrieval depended on structured fields such as category, capacity, amenities, and pricing semantics.
**Evolution:** Early thinking assumed raw descriptions could be embedded directly. That changed after the content API shape was inspected and found to lack the metadata needed for hard filtering.
**Decision:** Ingestion was designed to enrich products first, producing a structured sidecar before embedding and retrieval.
**Trade-off:** This adds LLM cost and schema-maintenance overhead during ingestion, but it enables typed filtering, cleaner ranking, and stronger evaluation.

### Retrieval Evaluation Criteria — 2026-04-07

**Tool:** Codex
**Sanitized Query:** Which evaluation metrics actually reflect success for a multi-slot retrieval system rather than a standard document search system?
**Context:** The system needed metrics that reflect whether a proposal can satisfy a full multi-part RFP, not just whether one ranked item looks relevant.
**Evolution:** Standard document-retrieval metrics were the initial mental model. They were replaced after recognizing that the critical failure mode is incomplete requirement coverage rather than imperfect ordering of a single result list.
**Decision:** Evaluation was centered on slot-level recall, full requirement coverage, constraint-violation rate, and within-slot ranking quality.
**Trade-off:** The evaluation harness became more domain-specific and requires curated goldens, but the resulting scores map better to actual proposal usefulness.

### Cross-Provider Review Workflow — 2026-04-07

**Tool:** Claude
**Sanitized Query:** How should Claude and Codex be combined across architecture, implementation, review, and QA without creating unnecessary overhead?
**Context:** The project involved architecture design, implementation, review, and adversarial checking across multiple AI-assisted steps.
**Evolution:** A single-model workflow was the initial default. That evolved into a cross-provider workflow after recognizing that review quality improves when architecture, implementation, and critique are not all produced by the same model family.
**Decision:** The workflow separated responsibilities by task type: architecture and implementation planning on one side, targeted review, bug-finding, and adversarial challenge on the other.
**Trade-off:** This introduced extra orchestration and handoff overhead, but reduced same-model confirmation bias and produced clearer review loops.

### CLAUDE.md and Sanitization Rules — 2026-04-07

**Tool:** Claude
**Sanitized Query:** Create project-level agent instructions and define sanitization rules so the AI collaboration log stays clean of private context.
**Context:** The project needed Claude-specific instructions (CLAUDE.md) that defer to the shared AGENTS.md, and a mechanical ruleset for stripping private context from prompts before they enter the public log.
**Evolution:** Initial CLAUDE.md was verbose and duplicated AGENTS.md content. It was compressed and given a clear delegation rule. Sanitization rules were then created covering strip, reframe, and keep categories with a mechanical rewrite pipeline.
**Decision:** CLAUDE.md became a short supplement pointing to AGENTS.md. Sanitization rules were created as a private reference and CLAUDE.md instructions enforce them before any log entry is written.
**Trade-off:** The indirection adds a read step before logging, but prevents accidental leakage of private strategy into shipped docs.

### Skill Promotion Timing — 2026-04-07

**Tool:** Claude
**Sanitized Query:** Should reusable agent skills be built before or after the app is scaffolded?
**Context:** AGENTS.md defines roles (architect, dataset explorer, contract writer, coverage writer, reviewer, documentation checker) but defers skill promotion until workflows stabilize.
**Evolution:** The initial impulse was to build all skills upfront so every phase uses them consistently. This was reconsidered against the roadmap principle of proving roles manually first.
**Decision:** Proceed with scaffolding first (Phase 1). Skills will be promoted after Phase 2 when recurring patterns are clear.
**Trade-off:** Early phases use manual prompts instead of structured skills, which is less consistent but avoids building skills that may not match the actual workflow.

### Phase 1 Bootstrap — 2026-04-07

**Tool:** Claude
**Sanitized Query:** Scaffold the Next.js app with TypeScript, Vitest, Zod, and the project directory structure.
**Context:** The project needed a working runtime and test harness before any domain code. The bootstrap had to match the stack decisions in the architecture doc.
**Evolution:** Node version had to be upgraded from 20.5.1 to 25.9.0 via asdf because Vitest 4 requires `node:util.styleText` which was unavailable in older releases. pnpm needed reinstalling under the new Node version.
**Decision:** Used `.tool-versions` to pin Node 25.9.0 locally. Kept the scaffold minimal: Next.js 16 App Router, Tailwind, ESLint, Zod 4, Vitest 4, tsx, path aliases, `.env.example`, and empty directory structure for all bounded contexts.
**Trade-off:** Pinning a non-LTS Node version adds a setup step for other contributors, but resolved all tooling compatibility issues cleanly.

### Dataset and API Exploration — 2026-04-07

**Tool:** Claude
**Sanitized Query:** Explore the Proposales API to map native fields, identify missing metadata, and draft the enrichment schema before writing retrieval code.
**Context:** The architecture assumes enrichment-first ingestion, but the actual API payload shape had not been verified against live endpoints.
**Evolution:** The API documentation and live responses confirmed the hypothesis: content items are title + description + images only. No category, capacity, pricing, unit, amenity, or tag fields exist natively. The content library was empty, so all products must be seeded.
**Decision:** Documented a complete field inventory, proposed enrichment schema with 9 category types and subtypes, defined retrieval text composition rules, normalization rules for capacity and pricing, alias mappings, and hard vs soft constraint classifications.
**Trade-off:** The enrichment schema is designed before seeing real product descriptions, so the taxonomy may need adjustment after seeding. Starting from the API shape rather than assumptions reduces that risk.

### Domain Contracts and Cross-Provider Review — 2026-04-07

**Tool:** Claude + Codex
**Sanitized Query:** Write Zod schemas for all pipeline data boundaries, then run adversarial review to find gaps before implementation starts.
**Context:** The pipeline has 5 stages passing typed data between them. Schemas needed to be defined before any logic so tests and implementation have shared contracts.
**Evolution:** Initial schemas were minimal and loosely typed. Cross-provider review identified 7 issues: the proposal block schema didn't model the real API entity, slot constraints were untyped, product schema mixed raw and enriched concerns, match results had parallel arrays instead of paired records, evaluation allowed invalid ranges, env was missing required keys, and IDs/capacities/prices lacked integer/non-negative constraints.
**Decision:** All 7 findings were addressed: added `RawContent` for the API boundary, `ApiProposalBlock` + `CreateProposalPayload` for the Proposales API, `RankedCandidate` to pair products with scores, typed `GapReason` enum, `BudgetHint` as structured money, clamped evaluation ratios to 0-1, added `ANTHROPIC_API_KEY` and `PROPOSALES_COMPANY_ID` to env, and tightened all IDs to positive integers and capacities/prices to non-negative.
**Trade-off:** Tighter schemas add parsing friction during development but catch invalid states at boundaries rather than deep in the pipeline.

### Architecture Document Update — 2026-04-08

**Tool:** Claude
**Sanitized Query:** Update the architecture document to reflect verified API shape, enrichment schema, typed contracts, and retrieval design decisions.
**Context:** The initial architecture doc was written before dataset exploration and schema definition. It described the system at a conceptual level but didn't reflect the actual API constraints, schema dependency graph, or typed gap handling.
**Evolution:** The doc was rewritten to include the real API shape (title + description only, no structured fields), the enrichment requirement, the full Mermaid flow with model assignments per stage, the acyclic schema dependency graph, the 18-approach evaluation summary, the scale story (50 → 500 → 500K), and security considerations.
**Decision:** Architecture doc now matches the implemented contracts exactly and can serve as a standalone system design reference.
**Trade-off:** The doc is longer and more detailed, which increases maintenance burden if schemas change. But the detail makes the retrieval strategy and design rationale self-contained.

### Architecture Adversarial Review — 2026-04-08

**Tool:** Codex
**Sanitized Query:** Review the architecture document for boundary leaks, speculative claims, missing runtime constraints, and mismatches with the actual schemas and API exploration.
**Context:** The architecture doc had been updated after dataset exploration and schema definition, but needed adversarial validation before being treated as the system design reference.
**Evolution:** Cross-provider review found 11 issues: the proposal section overstated modeled capabilities, PipelineRun lacked intermediate stage outputs, the retrieval field mapping was implicit, coverage semantics didn't account for optional slots, the API section hid the multilingual→flat transformation, scale claims used "current" for unbuilt features, EvalResult had untyped flags and no K parameter, gap recovery lacked a concrete relaxation strategy, runtime/cost budgets were absent, the Mermaid diagram didn't match PipelineStatus, and security claims exceeded actual implementation.
**Decision:** All 11 findings were addressed. Schema fixes: added `EvalFlag` enum, `recall_k` to EvalResult, `generated_blocks` and `review` to PipelineRun. Doc fixes: split Mermaid into data flow + state machine diagrams, added slot-field-to-retrieval mapping table, specified gap recovery strategy (drop indoor/outdoor → widen capacity → broaden category, max 2 retries), defined coverage as required-slots-only, documented the multilingual flattening boundary, added operational constraints section with timeout/cost/rate-limit details, and made security claims honest about implemented vs planned.
**Trade-off:** The architecture doc is now significantly longer but precisely matches what the schemas can express. Claims about unbuilt features are explicitly marked as planned.

### BDD Scenario Review and TDD Test Plan — 2026-04-08

**Tool:** Claude + Codex
**Sanitized Query:** Review BDD scenarios against the architecture and schemas, find blind spots, then write concrete tests before implementation.
**Context:** The existing 5 BDD scenarios were too vague to catch real bugs — a merged slot extractor, wrong coverage denominator, or unlimited retry loop could all pass green.
**Evolution:** Cross-provider review found 8 blind spots (optional-slot coverage, accommodation room semantics, indoor/outdoor relaxation, alias normalization, ranking quality, typed gap reasons, budget-as-money, multilingual flattening) and 5 scenario gaps (underconstrained assertions, stale two-day language, missing gap reasons). The 5 existing scenarios were tightened with concrete slot counts, types, and gap reasons. 5 new scenarios were added from the blind spots. A 12-product fixture catalog was designed to exercise all scenarios including intentional category gaps.
**Decision:** Rewrote BDD to 10 concrete scenarios. Created fixture catalog (12 products, 5 categories, deliberate gaps in entertainment/decoration/activity/dietary). Wrote 6 test files: schema validation (24 tests, passing), slot extraction, slot matching, coverage, scoring, and accommodation (all failing at import — TDD red phase).
**Trade-off:** Tests reference unimplemented functions and fail at import. This is intentional — Phase 6 implements the functions to make them pass. The risk is that test expectations may need adjustment once LLM extraction behavior is observed in practice.

### Plan Validation Against Evaluation Criteria — 2026-04-08

**Tool:** Claude + Codex
**Sanitized Query:** Validate the overall implementation plan against the project requirements. Identify black holes, missing critical pieces, and plan correctness.
**Context:** The project had completed documentation, schemas, and test stubs but needed to verify the plan would actually satisfy what evaluators look for: delivery of a working demo (35%), architecture quality (35%), leadership signals (20%), and process discipline (10%).
**Evolution:** Cross-provider adversarial review found 6 specific gaps: the architecture mentioned "18 approaches evaluated" without showing the reasoning, no "honest trade-offs" section existed, the AI log leaked a private directory reference, golden test sets were deferred too far, a schema field was missing, and a future integration point was undocumented. The overall plan direction was validated as correct (slot-based retrieval, enrichment-first, TDD, functional style, coverage metrics).
**Decision:** Created a private evaluation criteria rubric mapping requirements to checkpoints. Fixed all 6 gaps: added full 18-approach evaluation table to architecture, added trade-offs section, fixed the log leak, added `sources` to RawContent schema, noted future MCP integration. Created 5 reusable skills (codex-review, log-interaction, check-docs, implement-module, pre-commit) to accelerate execution.
**Trade-off:** Time spent on plan validation delays implementation, but validates that the remaining work targets the right evaluation dimensions and doesn't miss critical deliverables.

### Phase 6 Retrieval Implementation — 2026-04-09

**Tool:** Claude + Codex
**Sanitized Query:** Implement the first vertical slice: AI clients, seed data, catalog store, retrieval utils, slot extraction, per-slot matching, coverage calculation, and retrieval orchestrator with gap recovery.
**Context:** The retrieval pipeline is the core differentiator — slot-based matching with typed gap reasons, coverage verification, and constraint relaxation. Cross-provider critique found the original 3-module plan was insufficient: it skipped ingestion infrastructure and mixed retry logic into a pure coverage function.
**Evolution:** The plan was expanded from 3 to 8 modules in correct dependency order. Key design decisions: (1) AI clients use lazy initialization so tests don't require API keys, (2) `checkCoverage` is a pure function with no retry — recovery lives in the `retrieveForRfp` orchestrator, (3) `matchSlot` accepts an injectable `embed` function so unit tests use text-overlap fallback instead of live OpenAI calls, (4) `extractSlots` accepts an injectable `extract` function so unit tests use stubbed Haiku responses.
**Decision:** Implemented all 8 modules: AI clients with lazy init, 29-product seed catalog across 9 categories, JSON-backed catalog store, retrieval utils (cosine similarity, hard filtering, gap diagnosis, slot relaxation, alias normalization), Haiku-powered slot extraction with few-shot prompting, per-slot matching with hard filter + ranking, pure coverage calculation, and orchestrator with 2-round gap recovery. All 49 tests pass.
**Trade-off:** Unit tests use stubs and text-overlap fallback instead of real LLM/embedding calls. This makes tests deterministic and fast but means integration testing with live models is still needed to validate real extraction quality and ranking behavior.

### Codex Post-Implementation Review Fix Round — 2026-04-09

**Tool:** Claude + Codex
**Sanitized Query:** Fix findings from cross-provider post-implementation review of the retrieval core before merging.
**Context:** Post-implementation codex review found 5 issues in the fix commit itself, on top of the original 8. The review-before-commit skill was applied this time, catching issues before they entered the main branch.
**Evolution:** Two review rounds revealed compounding issues: the accommodation guests→rooms fallback was writing into the wrong field during relaxation; `no_candidates_after_relaxation` was dead code due to guard logic; mixed embedding catalogs dropped unembedded products instead of falling back gracefully; the architecture doc described a subtype-relaxation strategy the code didn't implement; and fixture data drifted from seed data.
**Decision:** Fixed all issues: `widenCapacity` helper preserves original field semantics (never cross-writes rooms↔guests); `no_candidates_after_relaxation` now replaces the original gap reason via immutable map instead of in-place mutation; mixed embedding ranking uses cosine for embedded products and text overlap for unembedded in the same result set; round 2 relaxation widened to 60% capacity (documented accurately); architecture doc updated to match actual behavior; fixture retrieval_text aligned with capacity values. Added 22 new tests for retrieval utils.
**Trade-off:** Two review rounds cost time but caught 5 issues that would have been harder to diagnose later. The review-before-commit workflow proved its value.

### Enrichment Pipeline Design — 2026-04-09

**Tool:** Claude + Codex
**Sanitized Query:** Design and implement the enrichment pipeline that transforms raw product data into structured retrieval-ready records with embeddings.
**Context:** The source API provides only title and description. All retrieval-critical fields (category, capacity, unit, amenities, tags) must be created through enrichment. Cross-provider review found the naive approach ("Haiku extract everything") was too generic — it missed that many fields are deterministically parseable.
**Evolution:** The design shifted from single-stage LLM extraction to a two-stage pipeline: (1) deterministic pre-parsing extracts capacity from regex patterns, infers unit from category, and detects indoor/outdoor from keywords — all without LLM cost; (2) Sonnet enrichment handles ambiguous fields (tags, amenities, dietary options, price model) with evidence-based extraction and confidence scoring. The model was upgraded from Haiku to Sonnet because enrichment is one-time and high-stakes — incorrect metadata permanently degrades retrieval.
**Decision:** Implemented: SeedProduct schema, deterministic pre-parser with 7 capacity regex patterns, Sonnet-powered enrichment with injectable dependency for testing, enhanced retrieval_text composition (includes pricing and dietary), batch embedding, and a full seed pipeline script with fault tolerance and observability logging. Key findings: capacity patterns vary significantly ("180 seated or 250 standing" vs "up to 40 rooms"), "Suite" keyword causes false indoor positives, and unit inference is fully deterministic by category.
**Trade-off:** Two-stage pipeline is more complex than pure LLM extraction, but reduces cost by ~60% and increases reliability for parseable fields. Sonnet costs ~3x more than Haiku per product but enrichment quality justifies it for a one-time operation.

### OpenRouter Provider Refactor — 2026-04-09

**Tool:** Claude + Codex
**Sanitized Query:** Refactor AI client from direct Anthropic + OpenAI SDKs to OpenRouter with direct SDK fallback.
**Context:** The AI client used two separate SDKs (Anthropic for chat, OpenAI for embeddings). For production, a single provider (OpenRouter) simplifies deployment and enables model routing flexibility.
**Evolution:** Initial refactor used a function named `useOpenRouter()` which triggered ESLint React hooks false positives. Codex review also found that the OpenAI SDK auto-reads `OPENAI_API_KEY` when `apiKey` is undefined, causing the Anthropic fallback client to silently use the wrong credentials.
**Decision:** Single `openai` SDK package routes through OpenRouter when `OPENROUTER_API_KEY` is set, falls back to direct Anthropic + OpenAI endpoints otherwise. Explicit key validation prevents cross-provider credential leaks. Function signatures unchanged — pure provider swap.
**Trade-off:** OpenRouter adds a network hop in production but provides single-provider billing and model fallback. Direct SDK fallback preserves local dev and testing workflow.

### NFR Hardening After Architecture Critique — 2026-04-09

**Tool:** Claude + Codex
**Sanitized Query:** Implement cheap, high-signal reliability patterns identified by architecture review — atomic writes, embedding retry, graceful degradation, catalog versioning, fixture drift fixes.
**Context:** Cross-provider architecture review found the system treated a git-tracked JSON file as a database without durability, versioning, or degradation behavior. Seven specific fixes were identified as "cheap to implement, high signal for production thinking."
**Evolution:** The catalog role was clarified: it's a generated build artifact (gitignored), not a committed database. Atomic writes prevent corruption. Catalog metadata tracks schema version, embedding model, enrichment model, and creation timestamp. Per-product source hashes enable idempotent re-enrichment. Embedding calls now have retry parity with chat calls. Slot matching degrades gracefully if embedding service fails. Individual slot failures no longer abort the entire retrieval pipeline.
**Decision:** Implemented all 7 fixes and documented the full reliability/consistency/observability story in the architecture doc with explicit "current vs production" tables showing what's implemented vs what's documented for scale.
**Trade-off:** These are lightweight patterns — no database, no queue, no distributed tracing. But they demonstrate awareness of production concerns at the right nuance for a demo-scale assessment.
