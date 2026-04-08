# Pre-Commit

Run all checks, stage, log, and commit. One atomic operation.

## Usage

Invoke when ready to commit. Pass a commit topic/description.

## Steps

1. Run lint: `pnpm lint`
2. Run build: `pnpm build`
3. Run tests: `pnpm test:run` (schema tests must pass; unimplemented module tests may fail)
4. Run codex review (use the codex-review skill)
5. Fix any issues found
6. Append AI collaboration log entry (use the log-interaction skill)
7. Stage all relevant files: `git add <specific files>` (never `git add -A`)
8. Commit with descriptive message (no Claude co-author signature)

## Commit Message Style

```
<type>: <short description>

<optional body explaining why>
```

Types: `feat`, `fix`, `docs`, `test`, `spike`, `chore`

## Safety Rules

- Never commit `.env` files or anything in `raw/`
- Never use `git add -A` or `git add .`
- Never push to remote without explicit user request
- Never amend previous commits — create new ones
- If pre-commit hook fails, fix the issue and create a new commit
