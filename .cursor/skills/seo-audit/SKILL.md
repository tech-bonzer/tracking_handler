---
name: seo-audit
description: Audits Next.js (or similar) routes against docs/seo.md and docs/performance.md and Google Search docs. Use for SEO audit, PageSpeed/SEO review, or /audit.
---

# SEO Audit

Checklist: [`docs/seo.md`](../../../../docs/seo.md) and [`docs/performance.md`](../../../../docs/performance.md). Google Search documentation wins on conflict. Do not apply Joe & Juice / Storyblok-specific schema.

Also invoked by [`commands/audit.md`](../../commands/audit.md).

## Repo-local skills (required)

Cloud agents do not receive the team marketplace plugin. **A copy of these skills must live in the project repo** so they can load them.

- **New projects:** copy all plugin skills into the repo **at the start**, before other work. This is a must.
- **Existing projects:** add the same copy unless the developer says not to.
- Destination: `.cursor/skills/<skill-name>/` — `implement-feature`, `investigate-bug`, `review-code`, `seo-audit`.
- Keep the copy aligned with this plugin. Do not invent a second set of instructions.

## Scope

Public, indexable routes. Skip or flag private/cart/account as **must be `noindex` + robots.txt**. Do not change production content unless the developer asked for fixes.

## Inspect

- Rendering: public data in initial HTML (**SSG or ISR**, then SSR); Server Components by default; `searchParams` forcing SSG off unintentionally.
- On-page: one `h1`, heading hierarchy, title/description as user CTA, breadcrumbs, `<a>` internal links, important content above the fold.
- URLs: pillar/cluster, canonical exact match (slash/www/https).
- Pagination crawlability; accordion/tab content in HTML.
- PageSpeed: unused JS, deferred third-party scripts, video/iframe/image lazy-load and posters, `srcset`/modern formats.
- Nice-to-have: JSON-LD matching visible content; OG; hreflang if locales exist.

## Report

Per route or pattern: **blocker / should fix / nice-to-have**, with the doc section. Do not invent numeric Lighthouse gates. Do not require a host (Vercel) unless the project already chose one — CDN/cache still applies for public SEO sites.
