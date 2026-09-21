---
name: implement-feature
description: Implements a feature using team docs — Turborepo/Next or built-project layout, feature api, coding standards, SEO for public Next pages, tests and git/PR rules. Use when adding or extending a feature.
---

# Implement Feature

Work from [`docs/`](../../../../docs/README.md). Do not invent conventions. Do not commit to `main` unless the developer explicitly asks ([`docs/ci-cd.md`](../../../../docs/ci-cd.md)).

## Repo-local skills (required)

Cloud agents do not receive the team marketplace plugin. **A copy of these skills must live in the project repo** so they can load them.

- **New projects:** copy all plugin skills into the repo **at the start**, before other work. This is a must.
- **Existing projects:** add the same copy unless the developer says not to.
- Destination: `.cursor/skills/<skill-name>/` — `implement-feature`, `investigate-bug`, `review-code`, `seo-audit`.
- Keep the copy aligned with this plugin. Do not invent a second set of instructions.

## Consult

1. [`docs/engineering-principles.md`](../../../../docs/engineering-principles.md) — maintainable architecture, no shortcuts.
2. App kind: Next.js product → [`docs/architecture.md`](../../../../docs/architecture.md) + [`docs/nextjs.md`](../../../../docs/nextjs.md). Tool/converter → [`docs/built-projects.md`](../../../../docs/built-projects.md). Code in `packages/**` → [`docs/internal-packages.md`](../../../../docs/internal-packages.md).
3. [`docs/coding-standards.md`](../../../../docs/coding-standards.md), [`docs/security.md`](../../../../docs/security.md). Public Next pages also [`docs/seo.md`](../../../../docs/seo.md) and [`docs/performance.md`](../../../../docs/performance.md).
4. [`docs/testing.md`](../../../../docs/testing.md).

## Interpret and investigate

- Restate the requirement. If it is ambiguous, ask before large changes.
- Find existing similar features and **reuse their `api`**. Do not import another feature’s internals; one-off exceptions get a comment ([nextjs.md](../../../../docs/nextjs.md)).
- Put new product behaviour in `src/features/<name>/` with an **`api`**. Handlers in `lib`, not a root `hooks/` folder. Names: `underscore` files/folders; camelCase functions; PascalCase components and types.

## Plan and implement

- If `.cursor/skills/` does not contain the four team skills, copy them first (see **Repo-local skills** above) unless the developer waived this.
- Prefer small, categorized files (~100-line rule of thumb). Tailwind on new React/Next apps. `@/` → `src/` when `src/` exists.
- Public content: **SSG or ISR** when possible; **Server Components** by default; `"use client"` only when required. Public SEO data stays on the server ([seo.md](../../../../docs/seo.md)).
- Catch external-data errors at the API; **log** them; no unhandled 500s. Front-end: attempt to log errors ([coding-standards.md](../../../../docs/coding-standards.md)).
- Internal packages: private, typed public API, unit-test that API, import via `workspace:*` after build.

## Validate

- Types; no unwarranted `any`. Prettier (tabs, width 4). ESLint if the repo has it.
- Unit tests only where required (must-not-fail server/data; **package APIs**). Other tests only if asked. Tests in a dedicated folder, pre-build, read-only vs DB/CMS.
- Build if possible. Branch `feature/...` from `main`; descriptive commits; PR with a real description ([ci-cd.md](../../../../docs/ci-cd.md)). Do not add or run Sanity/CMS writes from default CI; those go through the GitHub PR workflow unless the developer explicitly instructs otherwise.
