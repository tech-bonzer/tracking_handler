# Tracking handler builder

Build a small, consent-aware browser script containing only your tracking
configuration. No monorepo or runtime dependencies are required.

Supported integrations:

- Klaviyo
- Google Analytics (one or more IDs)
- Google Tag Manager (one or more IDs)
- Microsoft Clarity
- Hotjar
- ChatGPT advertising

## Build

Node.js 22 or newer is recommended.

```sh
npm install
```

Edit `tracking.config.ts`:

```ts
import { defineConfig } from './src/config'

export default defineConfig({
  klaviyo: 'PUBLIC_API_KEY',
  google_analytics: ['G-FIRST', 'G-SECOND'],
  google_tag_manager: 'GTM-EXAMPLE',
  clarity: null,
  hotjar: '1234567',
  chatgpt: null,
})
```

Then generate the minified script:

```sh
npm run build
```

The result is `dist/tracking.js`. Load it after your consent platform's initial
Google Consent Mode `default` command. Trackers are initialized only after the
required consent is granted:

- Klaviyo requires marketing consent.
- Analytics, Tag Manager, Clarity, Hotjar, and ChatGPT require statistics or
  marketing consent, matching the previous consent handler.
- ChatGPT receives both initial and subsequent consent state updates.

An alternative config and output can be selected without changing source:

```sh
node scripts/build.mjs --config=config/production.ts --out=public/tracking.js
```

The build rejects unknown keys and empty or non-string IDs.

## Bonzer data layer

The script creates `window.bonzer` before consent and tracking events are
emitted:

```ts
window.bonzer.buffer
window.bonzer.hooks.emit(event)
window.bonzer.hooks.filter(names, optionalBuffer)
const unsubscribe = window.bonzer.hooks.subscribe(callback, optionalNames)
```

Subscriptions replay matching buffered events before receiving live events.
Every event contains a unique `_id`, a `Date` timestamp, a name, and a payload.
Existing event names from `consent_handler` are preserved, including
`consent.initialized`, `consent.updated`, and
`tracking.<provider>.<added|loaded|error>`.

## Development

```sh
npm test
```
