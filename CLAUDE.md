# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` is the shared source of truth for repo workflow, build order, architecture direction, branching, and review gates. Follow `AGENTS.md` first and use this file as Claude-specific supplemental context.

## Project

AI Proposal Intelligence System for Proposales. RFPs → slot-based retrieval → structured proposals via Proposales API. Not flat-document RAG — retrieval unit is `RFP → requirement slots → candidates per slot → coverage check`.

**Stack:** Next.js (App Router), TypeScript, pnpm, Zod, Vitest, Vercel, Proposales v3 API, OpenRouter (chat routing) + OpenAI (embeddings), Sonnet (enrichment/generation), Haiku (per-request extraction).

## Commands

```bash
pnpm dev                                          # Dev server
pnpm build                                        # Production build
pnpm test                                         # Vitest watch
pnpm test:run                                     # Vitest CI
pnpm vitest run tests/unit/slot-extraction.test.ts # Single test
pnpm seed                                         # Seed + enrich + embed products
```

## Architecture

```
INGESTION:  Products → deterministic pre-parse → Sonnet enrichment → retrieval_text → embeddings → catalog.json
QUERY:      RFP → slot extraction (Haiku) → metadata filter → vector rank → coverage check → gap recovery
PIPELINE:   Slots + matches → plan → generate per block (Sonnet) → assemble via Proposales API → self-review (Sonnet)
EVAL:       slot_recall@K + coverage + heuristic validation (dates, guests) + LLM coherence (Sonnet)
```

Key directories: `src/server/{clients,ingestion,retrieval,pipeline,evaluation}`, `src/schemas/` (Zod contracts), `src/app/api/{run,catalog}` (routes), `src/app/ingestion/` (dashboard), `data/{seed,golden}`, `tests/{unit,fixtures}`, `docs/`, `scripts/`.

## Code Style

- Functional — pure functions, no classes, no ORM
- Zod schemas first, TDD, model cost-routing (Haiku cheap / Sonnet quality)
- Follow the build order and slice definition in `AGENTS.md`

## AI Collaboration Log

When I give you prompts or interactions to log, append them to `docs/AI-COLLABORATION-LOG.md` after sanitizing per `raw/sanitization-rules.md`.

Each log entry must include:

- `Tool:` which AI tool was used for that query: `Claude`, `Codex`, or `Claude + Codex`
- `Sanitized Query:` a privacy-safe paraphrase of the original query, not the raw prompt

Never reference `raw/` contents, file paths, personal details, interview context, evaluator names, other companies, or competitive strategy in the shipped log.

## Git

No Claude co-author signature on commits.

## Private

`raw/` is gitignored. Never commit or reference its contents in shipped code/docs.
