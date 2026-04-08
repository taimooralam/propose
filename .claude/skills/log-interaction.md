# Log Interaction

Append a sanitized entry to `docs/AI-COLLABORATION-LOG.md`.

## Usage

Invoke before every commit. Pass the raw interaction context.

## Steps

1. Read `raw/sanitization-rules.md` for the mechanical rewrite rules
2. Apply sanitization: strip evaluator names, interview context, private paths, competitive positioning
3. Reframe: candidate language → engineering language, assessment → project
4. Keep: technical decisions, self-corrections, trade-offs
5. Append entry to `docs/AI-COLLABORATION-LOG.md` using this template:

```markdown
### [Topic] — [Date YYYY-MM-DD]

**Tool:** Claude | Codex | Claude + Codex
**Sanitized Query:** Privacy-safe paraphrase of what was asked
**Context:** What problem was being solved
**Evolution:** How thinking changed (before → after)
**Decision:** What was chosen and why
**Trade-off:** What was sacrificed
```

## Final Leak Check

Before writing, verify the entry contains NONE of:
- Evaluator names or titles
- `raw/` or private file paths
- Interview/assessment/candidate language
- Other company names
- CV/resume/dossier references

## Notes

- Every entry must include `Tool:` and `Sanitized Query:` fields
- Use first-person plural ("we evaluated") or passive voice
- Engineering journal tone, not self-marketing
