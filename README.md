# Propose — AI Proposal Intelligence System

Slot-based retrieval system that turns unstructured hotel event RFPs into structured proposals via the Proposales API. Not flat-document RAG — the retrieval unit is `RFP → requirement slots → candidates per slot → coverage check`.

**What ships:**
- Slot extraction from RFPs via Haiku (typed `RequirementSlot` with category, capacity, constraints)
- Per-slot product matching with hard filtering (category, capacity, indoor/outdoor) + dense ranking
- Coverage verification with typed gap reasons and 2-round constraint relaxation
- LLM-generated proposal blocks per slot (Sonnet writes contextual content)
- Proposal creation via Proposales API (`POST /v3/proposals`)
- Self-review: Sonnet compares proposal against original RFP, flags mismatches
- Evaluation: deterministic metrics (slot_recall, coverage, violations) + heuristic validation (dates, guest counts) + LLM coherence scoring
- Two-stage enrichment pipeline: deterministic pre-parsing + Sonnet extraction with confidence scoring
- Ingestion dashboard showing raw → enriched product comparison

Functional TypeScript, Zod contracts at every boundary, no ORM, retrieval core in small pure modules.

## Review Path

| What | Where |
|---|---|
| System design + retrieval strategy | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Retrieval core | [src/server/retrieval/](src/server/retrieval/) — `extract-slots.ts` → `match-slots.ts` → `coverage.ts` |
| Proposal pipeline | [src/server/pipeline/](src/server/pipeline/) — `assemble-thin.ts` → `generate-blocks.ts` → `self-review.ts` |
| Evaluation | [src/server/evaluation/](src/server/evaluation/) — `heuristic.ts` + `validate.ts` + `coherence.ts` |
| Enrichment pipeline | [src/server/ingestion/](src/server/ingestion/) — `pre-parse.ts` → `enrich.ts` → `embed.ts` |
| Zod contracts | [src/schemas/](src/schemas/) — `slot.ts`, `product.ts`, `match.ts`, `review.ts` |
| Tests (TDD) | [tests/unit/](tests/unit/) — 94 tests across 9 files |
| AI collaboration log | [docs/AI-COLLABORATION-LOG.md](docs/AI-COLLABORATION-LOG.md) |

## Quick Start

```bash
pnpm install
cp .env.example .env
# Add to .env:
#   OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) — for slot extraction + generation
#   OPENAI_API_KEY — for embeddings
#   PROPOSALES_API_KEY — for proposal creation (optional)
pnpm seed            # Optional: re-enrich products (~4 min, requires API keys)
pnpm dev             # http://localhost:3000
```

The app loads a pre-generated enriched catalog. `pnpm seed` is only needed to re-run the enrichment pipeline.

**Try it:** Open http://localhost:3000, click a preset RFP (Simple Meeting, Product Launch, or Wedding), and click "Analyse RFP." Toggle "Full pipeline" for Sonnet generation + self-review + coherence scoring.

**Ingestion dashboard:** Visit http://localhost:3000/ingestion to see the enriched catalog with raw → enriched comparison per product.

## Pipeline Modes

| Mode | What runs | Latency | Vercel plan |
|---|---|---|---|
| **Fast** (default) | Haiku extraction → matching → coverage → thin assembly → deterministic eval | ~3-5s | Hobby (10s) |
| **Full** (checkbox) | + Sonnet block generation → Proposales API → self-review → LLM coherence | ~30-50s | Pro (60s) |

## Current Scope and Limitations

**Implemented:**
- Full retrieval pipeline: slot extraction → hard filter → dense rank → coverage → gap recovery
- Agentic proposal pipeline: plan → generate per block (Sonnet) → assemble via Proposales API → self-review
- Three-layer evaluation: deterministic metrics + heuristic validation + LLM coherence scoring
- Enrichment: two-stage (deterministic pre-parse + Sonnet), 29 products across 9 categories
- Ingestion dashboard with raw → enriched comparison and pipeline stage visibility
- Fast/full mode toggle for Vercel timeout compatibility
- Golden test sets for all 3 assessment RFPs

**Intentionally deferred (documented in [ARCHITECTURE.md](docs/ARCHITECTURE.md#trade-offs-and-scope-decisions)):**
- Streaming/async execution via Trigger.dev
- Postgres + pgvector (JSON catalog sufficient for 29 products)
- MCP server wrapping Proposales API
- Cross-encoder reranking (deferred to 500K+ product scale)

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test:run` | Run 94 unit tests |
| `pnpm seed` | Re-run enrichment pipeline (requires API keys, ~4 min) |
| `pnpm lint` | ESLint |
