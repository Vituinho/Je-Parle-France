<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Je Parle Français — working notes for agents

- Product, pedagogy and architecture live in `docs/`. Read `docs/ARCHITECTURE.md` first.
- Course content is data, not UI: it lives in `content/` and is validated by Zod schemas in
  `src/lib/content/schema`. Run `npm run content:check` after editing content.
- Learning engines (placement, mastery, FSRS, daily planner, graders) are pure TypeScript in
  `src/lib/learning/**` and must stay framework-free and unit-tested.
- External AI/speech providers are only reached through the adapters in `src/lib/ai/**`.
- Local database: `npm run db:local -- init` then `npm run db:migrate`.
- Before committing: `npm run lint && npm run typecheck && npm test` (and `npm run build` for
  routing/config changes). One logical unit per commit.
