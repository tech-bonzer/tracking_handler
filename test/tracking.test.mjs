import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import vm from 'node:vm'
import { parseHTML } from 'linkedom'

const root = path.resolve(import.meta.dirname, '..')

function browser(html = '<!doctype html><html><head></head><body></body></html>') {
  const { document } = parseHTML(html)
  const window = { document }
  return {
    window,
    document,
    run: (code) => vm.runInNewContext(code, { window, document }),
  }
}

async function buildFixture(configSource) {
  const directory = await mkdtemp(path.join(tmpdir(), 'tracking-handler-'))
  const configPath = path.join(directory, 'tracking.config.ts')
  const outputPath = path.join(directory, 'tracking.js')
  await writeFile(configPath, configSource)

  const result = spawnSync(
    process.execPath,
    [
      'scripts/build.mjs',
      `--config=${configPath}`,
      `--out=${outputPath}`,
    ],
    { cwd: root, encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
  return {
    code: await readFile(outputPath, 'utf8'),
    cleanup: () => rm(directory, { recursive: true, force: true }),
  }
}

test('builds a consent-gated tracker and preserves the Bonzer event API', async () => {
  const fixture = await buildFixture(`
    export default {
      klaviyo: 'KLAVIYO',
      google_analytics: ['G-FIRST', 'G-FIRST', 'G-SECOND'],
      google_tag_manager: 'GTM-TEST',
      clarity: 'CLARITY',
      hotjar: '12345',
      chatgpt: 'CHATGPT'
    }
  `)
  const page = browser()
  const { window } = page
  window.dataLayer = [
    [
      'consent',
      'default',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      },
    ],
  ]

  page.run(fixture.code)

  assert.ok(window.bonzer)
  assert.deepEqual(
    Array.from(window.bonzer.buffer.slice(0, 2), (event) => event.name),
    ['events.initialized', 'consent.initialized'],
  )
  assert.equal(window.document.querySelectorAll('script[data-ref-item]').length, 0)
  assert.equal(
    window.bonzer.hooks.filter(['consent.initialized']).length,
    1,
  )

  const replayed = []
  const unsubscribe = window.bonzer.hooks.subscribe(
    (event) => replayed.push(event.name),
    ['consent.initialized', 'consent.updated'],
  )
  assert.deepEqual(replayed, ['consent.initialized'])

  window.dataLayer.push([
    'consent',
    'update',
    {
      analytics_storage: 'granted',
      ad_storage: 'granted',
    },
  ])

  const scripts = [
    ...window.document.querySelectorAll('script[data-ref-item]'),
  ]
  assert.equal(scripts.length, 7)
  assert.equal(
    new Set(scripts.map((script) => script.dataset.refItem)).size,
    7,
  )
  assert.equal(
    window.bonzer.hooks.filter([
      'tracking.klaviyo.added',
      'tracking.google_analytics.added',
      'tracking.google_tag_manager.added',
      'tracking.clarity.added',
      'tracking.hotjar.added',
      'tracking.chatgpt.added',
    ]).length,
    7,
  )

  const chatGptQueue = window.oaiq.q
  assert.equal(chatGptQueue[0][0], 'init')
  assert.equal(chatGptQueue[0][1].pixelId, 'CHATGPT')
  assert.deepEqual(Array.from(chatGptQueue[1]), ['consent', true])

  window.dataLayer.push([
    'consent',
    'update',
    {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    },
  ])
  assert.deepEqual(Array.from(chatGptQueue.at(-1)), ['consent', false])
  assert.equal(
    window.document.querySelectorAll('script[data-ref-item]').length,
    7,
  )
  assert.deepEqual(replayed, [
    'consent.initialized',
    'consent.updated',
    'consent.updated',
  ])

  unsubscribe()
  window.dataLayer.push([
    'consent',
    'update',
    { analytics_storage: 'granted' },
  ])
  assert.equal(replayed.length, 3)

  const replacementBuffer = []
  window.bonzer.buffer = replacementBuffer
  window.bonzer.hooks.emit({ name: 'events.initialized', payload: undefined })
  assert.equal(replacementBuffer.length, 1)

  await fixture.cleanup()
})

test('rejects unknown configuration keys at build time', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tracking-handler-'))
  const configPath = path.join(directory, 'tracking.config.ts')
  await writeFile(configPath, `export default { unknown_tracker: 'id' }`)

  const result = spawnSync(
    process.execPath,
    ['scripts/build.mjs', `--config=${configPath}`],
    { cwd: root, encoding: 'utf8' },
  )

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Unknown tracking config key: unknown_tracker/)
  await rm(directory, { recursive: true, force: true })
})

test('removes disabled integrations and reads serialized consent commands', async () => {
  const fixture = await buildFixture(`
    export default { google_analytics: 'G-ONLY' }
  `)
  assert.doesNotMatch(fixture.code, /static\.klaviyo\.com/)
  assert.doesNotMatch(fixture.code, /clarity\.ms/)
  assert.doesNotMatch(fixture.code, /static\.hotjar\.com/)

  const page = browser()
  page.window.dataLayer = [
    {
      0: 'consent',
      1: 'default',
      2: { analytics_storage: 'granted' },
    },
  ]
  page.run(fixture.code)

  const scripts = Array.from(page.document.querySelectorAll('script')).filter(
    (script) => script.dataset.refItem === 'tracking_ga_G-ONLY',
  )
  assert.equal(scripts.length, 1)
  assert.deepEqual(
    Array.from(
      page.window.bonzer.hooks.filter(['tracking.google_analytics.added']),
      (event) => event.name,
    ),
    ['tracking.google_analytics.added'],
  )

  await fixture.cleanup()
})
