---
name: investigate-bug
description: Investigates a bug using team docs — reproduce, narrow scope, prefer feature APIs, no extra tests or refactors unless asked. Use when debugging or the user reports a defect.
---

# Investigate Bug

Follow [`docs/`](../../../../docs/README.md). Do not rewrite architecture while investigating. Do not commit to `main` unless asked ([`docs/ci-cd.md`](../../../../docs/ci-cd.md)).

## Repo-local skills (required)

Cloud agents do not receive the team marketplace plugin. **A copy of these skills must live in the project repo** so they can load them.

- **New projects:** copy all plugin skills into the repo **at the start**, before other work. This is a must.
- **Existing projects:** add the same copy unless the developer says not to.
- Destination: `.cursor/skills/<skill-name>/` — `implement-feature`, `investigate-bug`, `review-code`, `seo-audit`.
- Keep the copy aligned with this plugin. Do not invent a second set of instructions.

## Interpret and reproduce

- Restate expected vs actual behaviour. Reproduce when possible (read-only vs real DB/CMS — [`docs/testing.md`](../../../../docs/testing.md)).
- If it cannot be reproduced, say what is missing (data, env, route).

## Investigate

- Start at the feature **`api`**, then internals. Do not assume cross-feature imports are the design.
- Check types, server vs client boundaries already in [`docs/seo.md`](../../../../docs/seo.md) (public HTML vs private CSR), and secrets/input rules in [`docs/security.md`](../../../../docs/security.md).
- Keep notes short. Prefer a file-top doc comment only if you add lasting context ([`docs/coding-standards.md`](../../../../docs/coding-standards.md)).

## Outcome

- Report likely cause, files, and a minimal fix. Do not expand scope (new features, extra test types, drive-by refactors) unless the developer asks.
- If they want a fix implemented, follow implement-feature constraints: `bugfix/` branch, descriptive commits, PR, build if possible.
