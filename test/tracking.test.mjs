import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { JSDOM } from 'jsdom'

const root = path.resolve(import.meta.dirname, '..')

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
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://example.com',
  })
  const { window } = dom
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

  window.eval(fixture.code)

  assert.ok(window.bonzer)
  assert.deepEqual(
    window.bonzer.buffer.slice(0, 2).map((event) => event.name),
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
  assert.deepEqual(chatGptQueue[0], ['consent', true])
  assert.deepEqual(chatGptQueue[1], ['init', { pixelId: 'CHATGPT' }])

  window.dataLayer.push([
    'consent',
    'update',
    {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    },
  ])
  assert.deepEqual(chatGptQueue.at(-1), ['consent', false])
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

  dom.window.close()
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
