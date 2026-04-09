# Propose — AI Proposal Intelligence System

Slot-based retrieval system that turns unstructured hotel event RFPs into structured proposals. Not flat-document RAG — the retrieval unit is `RFP → requirement slots → candidates per slot → coverage check`.

**What ships:**
- Slot extraction from RFPs via Haiku (typed `RequirementSlot` with category, capacity, constraints)
- Per-slot product matching with hard filtering (category, capacity, indoor/outdoor) + dense ranking
- Coverage verification with typed gap reasons and 2-round constraint relaxation
- Thin proposal assembly (top candidate per slot)
- Deterministic evaluation: `slot_recall@3`, `full_coverage`, `constraint_violation_rate`
- Two-stage enrichment pipeline: deterministic pre-parsing + Sonnet extraction with confidence scoring

Functional TypeScript, Zod contracts at every boundary, no ORM, retrieval core in small pure modules.

## Review Path

| What | Where |
|---|---|
| System design + retrieval strategy | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Retrieval core | [src/server/retrieval/](src/server/retrieval/) — `extract-slots.ts` → `match-slots.ts` → `coverage.ts` |
| Enrichment pipeline | [src/server/ingestion/](src/server/ingestion/) — `pre-parse.ts` → `enrich.ts` → `embed.ts` |
| Zod contracts | [src/schemas/](src/schemas/) — `slot.ts`, `product.ts`, `match.ts` |
| Tests (TDD) | [tests/unit/](tests/unit/) — 94 tests across 9 files |
| AI collaboration log | [docs/AI-COLLABORATION-LOG.md](docs/AI-COLLABORATION-LOG.md) |

## Quick Start

```bash
pnpm install
cp .env.example .env
# Add to .env:
#   OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) — for slot extraction
#   OPENAI_API_KEY — for embeddings
pnpm seed            # Optional: re-enrich products (~4 min, requires API keys)
pnpm dev             # http://localhost:3000
```

The app loads a pre-generated enriched catalog. `pnpm seed` is only needed to re-run the enrichment pipeline.

**Try it:** Open http://localhost:3000, click a preset RFP (Simple Meeting, Product Launch, or Wedding), and click "Analyse RFP."

## Current Scope and Limitations

**Implemented:**
- Full retrieval pipeline: slot extraction → hard filter → dense rank → coverage → gap recovery
- Enrichment: two-stage (deterministic pre-parse + Sonnet LLM), 29 products across 9 categories
- API route: synchronous single-request execution
- UI: single-page flow showing slots → matches → coverage → proposal → scores

**Intentionally deferred (documented in [ARCHITECTURE.md](docs/ARCHITECTURE.md#trade-offs-and-scope-decisions)):**
- Proposales API proposal creation (thin local assembly instead)
- LLM coherence scoring (deterministic metrics only)
- Streaming/async execution (synchronous within Vercel 60s timeout)
- Postgres + pgvector (JSON catalog sufficient for 29 products)
- Trigger.dev async orchestration
- MCP server wrapping Proposales API

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test:run` | Run 94 unit tests |
| `pnpm seed` | Re-run enrichment pipeline (requires API keys, ~4 min) |
| `pnpm lint` | ESLint |
