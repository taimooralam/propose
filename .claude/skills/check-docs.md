# Check Documentation Consistency

Verify that documentation matches code, schemas, and environment.

## Usage

Invoke before merge or release. Run after significant changes.

## Steps

1. Compare `docs/ARCHITECTURE.md` bounded contexts against actual `src/server/` directory structure
2. Verify every schema mentioned in ARCHITECTURE.md exists in `src/schemas/`
3. Check that `.env.example` matches `src/env.ts` schema
4. Verify `CLAUDE.md` commands still work (`pnpm dev`, `pnpm build`, `pnpm test:run`)
5. Check `README.md` is not boilerplate (must have project description + quick start)
6. Verify BDD scenarios in `docs/BDD-SCENARIOS.md` reference types that exist in schemas
7. Check AI collaboration log has no `raw/` references or evaluator names
8. Verify `docs/IMPLEMENTATION-ROADMAP.md` reflects current progress

## Red Flags

- Architecture claims "implemented" for code that doesn't exist
- Schema mentioned in docs but not in `src/schemas/`
- Env vars in code but not in `.env.example`
- Stale README (still says "create-next-app")
- AI log leaks private context
