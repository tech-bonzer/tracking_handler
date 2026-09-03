import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { build } from 'esbuild'

const root = process.cwd()
const option = (name, fallback) => {
  const prefix = `--${name}=`
  return (
    process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ??
    fallback
  )
}

const configPath = path.resolve(root, option('config', 'tracking.config.ts'))
const outputPath = path.resolve(root, option('out', 'dist/tracking.js'))
const providerNames = [
  'klaviyo',
  'google_analytics',
  'google_tag_manager',
  'clarity',
  'hotjar',
  'chatgpt',
]

async function loadConfig() {
  const result = await build({
    entryPoints: [configPath],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    logLevel: 'silent',
  })
  const source = result.outputFiles[0]?.text
  if (!source) throw new Error(`Could not compile ${configPath}`)
  const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  return module.default
}

function validateConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Tracking config must default-export an object')
  }

  const unknown = Object.keys(input).filter((key) => !providerNames.includes(key))
  if (unknown.length) {
    throw new TypeError(`Unknown tracking config key${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`)
  }

  const config = {}
  for (const provider of providerNames) {
    const value = input[provider]
    if (value == null) continue
    const values = Array.isArray(value) ? value : [value]
    if (!values.every((id) => typeof id === 'string' && id.trim().length > 0)) {
      throw new TypeError(`${provider} must be a non-empty string, an array of non-empty strings, or null`)
    }
    config[provider] = [...new Set(values.map((id) => id.trim()))]
  }
  return config
}

const config = validateConfig(await loadConfig())
await mkdir(path.dirname(outputPath), { recursive: true })
await build({
  entryPoints: [path.join(root, 'src/browser.ts')],
  bundle: true,
  outfile: outputPath,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  define: {
    __TRACKING_CONFIG__: JSON.stringify(config),
  },
})

console.log(`Built ${path.relative(root, outputPath)} from ${path.relative(root, configPath)}`)
