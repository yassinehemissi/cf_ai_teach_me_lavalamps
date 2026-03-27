<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Agent Rules

Before planning, coding, or reviewing, every agent working in this repository must read and follow:

- `AGENTS.md`
- `CODING_RULES.MD`
- `PLAN.MD`

These files are mandatory execution constraints, not optional reference material.

## Enforcement

- Do not start implementation before reading the three files above.
- Treat `CODING_RULES.MD` as the source of truth for architecture, editing limits, UI structure, simulation boundaries, and prompt logging.
- Treat `PLAN.MD` as the active project roadmap and keep new work aligned with its phase boundaries.
- If an instruction conflicts with an ad hoc shortcut, follow the repository documents.
- If a repository document becomes outdated, update it before or alongside the code that depends on it.
