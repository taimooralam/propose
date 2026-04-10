# Submission — AI Proposal Intelligence System

## Deliverables

1. **Working web application (Vercel)**
   https://propose-m550w2t6q-taimoor-alams-projects-33f72f51.vercel.app

   - Main page: paste an RFP or select a preset (Simple Meeting, Product Launch, Wedding) → see extracted requirement slots, per-slot product matches with similarity scores, coverage report with typed gap reasons, generated proposal blocks, and evaluation scores
   - Ingestion dashboard (`/ingestion`): browse the enriched product catalog with a raw → enriched comparison per product, showing exactly what the two-stage enrichment pipeline added — deterministic pre-parsing (capacity, unit, indoor/outdoor) and Sonnet extraction (tags, amenities, dietary options, price model)

2. **Architecture document**
   [docs/ARCHITECTURE.md](ARCHITECTURE.md)

   Covers: system diagram (Mermaid), slot-based retrieval strategy (18 approaches evaluated across 6 tiers with verdicts), enrichment-first ingestion design, model selection rationale (Haiku for per-request extraction, Sonnet for enrichment/generation/review), three-layer evaluation methodology, scale story (50 → 500 → 500K products), reliability/consistency/observability patterns with current vs production tables, security considerations (implemented vs planned), and honest trade-offs (what ships, what was cut, what to add with more time).

3. **Source code (GitHub)**
   https://github.com/taimooralam/propose

   Functional TypeScript, Zod contracts at every data boundary, 94 unit tests written before implementation (TDD), no ORMs or classes. The retrieval core lives in small pure modules under `src/server/retrieval/`.

4. **AI collaboration log**
   [docs/AI-COLLABORATION-LOG.md](AI-COLLABORATION-LOG.md)

   15 entries documenting the design evolution — from challenging an initial hybrid retrieval assumption through to the slot-based architecture, cross-provider adversarial review workflow (Claude for architecture, Codex for critique), enrichment pipeline findings, and production hardening decisions.

---

## The Three Components

### Component 1: Intelligent Content Matching

The Proposales Content API stores products as title + description only — no structured category, capacity, or amenity fields. So I built a two-stage enrichment pipeline: (1) deterministic pre-parsing extracts capacity from description patterns via regex and infers unit/indoor-outdoor from category rules, (2) Sonnet extracts ambiguous fields (tags, amenities, dietary options, price model) with evidence-based extraction and confidence scoring.

The retrieval layer uses slot-based matching rather than whole-query retrieval. An RFP is decomposed into typed requirement slots (venue, catering, accommodation, etc.), and each slot is matched independently: hard filtering (category, capacity, indoor/outdoor) eliminates irrelevant products, then dense ranking via cosine similarity on text-embedding-3-small vectors selects the top 3 candidates per slot. A coverage check verifies all required slots are satisfied, with 2-round constraint relaxation for gap recovery.

The ingestion dashboard at `/ingestion` shows the full catalog with raw → enriched comparison — click any product row to see what each pipeline stage added.

### Component 2: Agentic Proposal Builder

The pipeline has five distinct steps, each with its own prompt and validation:

1. **Extract:** Haiku extracts typed RequirementSlot array from the RFP (with few-shot prompting, temperature 0, Zod validation)
2. **Plan:** Top-matched product assigned per covered slot, gap notes generated for uncovered slots
3. **Generate:** Sonnet writes contextual proposal content per block, weaving the matched product into the specific event requirements
4. **Assemble:** Proposal created via `POST /v3/proposals` with real `variation_id` references to the content library
5. **Self-review:** Sonnet compares the generated proposal against the original RFP and flags missing requirements, mismatched details, and unaddressed gaps with severity ratings

Each step has graceful fallback — if Sonnet generation fails for a block, thin assembly (product title + description) is used instead. If the Proposales API call fails, the proposal plan is still returned locally. Individual slot matching failures don't abort the entire pipeline (`Promise.allSettled`).

### Component 3: Quality & Evaluation

Three evaluation layers:

- **Deterministic metrics:** `slot_recall@3` (fraction of required slots with valid candidates in top 3), `full_coverage` (required slots covered), `constraint_violation_rate` (hard filter precision)
- **Heuristic validation:** checks date presence in proposal blocks, guest count accuracy against RFP requirements, and slot-to-block coverage completeness
- **LLM coherence scoring:** Sonnet rates the proposal on completeness, relevance, coherence, and professionalism (1–5 scale, normalized to 0–1)

All evaluation results are displayed in the UI alongside the generated proposal, with typed flags for specific issues (`missing_slot_coverage`, `date_missing`, `guest_count_mismatch`, etc.).

---

## Pipeline Modes

| Mode | What runs | Latency | Vercel plan |
|---|---|---|---|
| **Fast** (default) | Haiku extraction → matching → coverage → thin assembly → deterministic eval | ~3-5s | Hobby (10s) |
| **Full** (checkbox) | + Sonnet block generation → Proposales API → self-review → LLM coherence | ~30-50s | Pro (60s) or local |

To see the full agentic pipeline, check the **"Full pipeline"** checkbox above the submit button before clicking "Analyse RFP."

---

## Running Locally

```bash
git clone https://github.com/taimooralam/propose.git
cd propose
pnpm install
cp .env.example .env
# Add to .env:
#   OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) — for slot extraction + generation
#   OPENAI_API_KEY — for embeddings
#   PROPOSALES_API_KEY — for proposal creation (optional)
pnpm dev
# Open http://localhost:3000
```

The app ships with a pre-enriched catalog of 29 hotel products across 9 categories. No need to run `pnpm seed` unless you want to re-run the enrichment pipeline (~4 minutes).
