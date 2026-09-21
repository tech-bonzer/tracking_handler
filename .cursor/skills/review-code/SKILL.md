---
name: review-code
description: Reviews diffs against team engineering docs (structure, naming, types, security minimum, SEO/performance for Next, tests, git). Use when reviewing a PR, a diff, or when the user asks for a code review.
---

# Review Code

Review against [`docs/`](../../../../docs/README.md) only. Do not invent extra house style. Industry practice fills gaps ([`docs/engineering-principles.md`](../../../../docs/engineering-principles.md)).

Also invoked by [`commands/review.md`](../../commands/review.md).

## Repo-local skills (required)

Cloud agents do not receive the team marketplace plugin. **A copy of these skills must live in the project repo** so they can load them.

- **New projects:** copy all plugin skills into the repo **at the start**, before other work. This is a must.
- **Existing projects:** add the same copy unless the developer says not to.
- Destination: `.cursor/skills/<skill-name>/` — `implement-feature`, `investigate-bug`, `review-code`, `seo-audit`.
- Keep the copy aligned with this plugin. Do not invent a second set of instructions.
- Missing `.cursor/skills/` copies (without an explicit waiver) is a **blocker**.

## Check

- **Structure:** Next vs built-project vs `packages/**`. Feature `api` as public surface. No huge uncategorized folders. Handlers in `lib`.
- **Code:** underscore names; camelCase vs PascalCase; prefer `type`; `@/` ; Tailwind on new React/Next; comments only when useful; ~100-line thumb; catch external-data errors and **log** (no unhandled 500); front-end **attempt to log**.
- **Security:** no secrets in git/logs; input at boundaries; authz not trusted from the client ([`docs/security.md`](../../../../docs/security.md)).
- **SEO/performance** (public Next): server-first SSG/ISR, headings, canonicals, `<a>` links, lazy media ([`docs/seo.md`](../../../../docs/seo.md), [`docs/performance.md`](../../../../docs/performance.md)).
- **Tests:** package APIs unit-tested; must-not-fail server/data recommended; no extra suites unprompted; dedicated folder; read-only.
- **Git:** not a direct `main` dump unless requested; descriptive commits/PR. Default CI must not write to Sanity/CMS; those writes are the GitHub PR workflow only, unless the developer explicitly waived that ([`docs/ci-cd.md`](../../../../docs/ci-cd.md)).
- **Packages:** private, built, `workspace:*`, API-only imports.

## Output

Group findings:

- **Blockers** — contradicts a documented must (secrets, `main` commit, mutating CMS in tests, **default CI writing to Sanity/CMS**, missing package API tests, public page with no canonical when adding indexable routes, missing `.cursor/skills/` copies of team skills without a waiver, etc.)
- **Should fix** — documented shoulds (naming, `@/`, feature `api`, Tailwind on a new app)
- **Notes** — industry-default suggestions where docs are silent; mark them as not team policy

Do not demand a rewrite of existing structure. New code is the bar.
