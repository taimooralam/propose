# Implement Module

Implement a server module until its tests pass. Follows TDD green phase.

## Usage

Provide: module path and corresponding test file(s).

Example: `implement-module src/server/retrieval/extract-slots.ts tests/unit/slot-extraction.test.ts`

## Steps

1. Read the test file to understand expected behavior
2. Read relevant schemas from `src/schemas/`
3. Read `docs/ARCHITECTURE.md` for the module's responsibilities
4. Implement the module following these rules:
   - **Functional style**: pure functions, no classes, no ORM
   - **Zod validation**: parse inputs/outputs at boundaries
   - **Small functions**: each function does one thing
   - **Explicit data flow**: no hidden state, no global singletons
   - **Type-safe**: leverage TypeScript strict mode
5. Run the test file: `pnpm vitest run <test-file>`
6. Fix until tests pass
7. Run full test suite: `pnpm test:run`
8. Run build: `pnpm build`

## Code Style Rules

- Export named functions, not default exports
- Use `async` only when calling external services (LLM, API, embedding)
- Prefer `const` over `let`
- No `any` types — use Zod inference
- Error handling: throw typed errors, don't swallow silently
- Cost routing: Haiku for extraction/enrichment, Sonnet for generation/evaluation
