# Codex Review

Run adversarial review on uncommitted changes before committing.

## Usage

Invoke before every commit on significant changes. Pass a focus area if specific.

## Steps

1. Run: `/Users/ala0001t/.asdf/installs/nodejs/20.5.1/bin/node /Users/ala0001t/.asdf/installs/nodejs/20.5.1/bin/codex exec --sandbox read-only "<review prompt>"`
2. Review findings
3. Fix issues that are genuine (not speculative)
4. Proceed to commit

## Default Review Prompt

```
Review all uncommitted changes in this repository. Check for:
1. Bugs, logic errors, or incorrect assumptions
2. Security issues (prompt injection, API key leaks, unvalidated input)
3. Contract drift between schemas in src/schemas/ and implementation
4. Anti-patterns: classes, ORMs, context stuffing, hidden mutable state
5. Architecture inconsistency with docs/ARCHITECTURE.md
6. Missing or broken tests
7. Style: must be functional, small pure functions, explicit data flow

Be critical. Reference file paths and line numbers. Do not praise.
```

## Notes

- Codex is installed under Node 20.5.1, not the project's Node 25.9.0
- Always use `--sandbox read-only` for review
- Do not commit until findings are addressed or explicitly deferred
