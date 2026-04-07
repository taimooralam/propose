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
**Decision:** CLAUDE.md became a short supplement pointing to AGENTS.md. Sanitization rules were stored privately in `raw/` and referenced by CLAUDE.md instructions.
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
