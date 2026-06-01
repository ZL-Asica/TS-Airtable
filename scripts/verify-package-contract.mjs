import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmpRoot = mkdtempSync(join(tmpdir(), 'ts-airtable-package-'))
const npmCache = join(tmpRoot, 'npm-cache')

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
    stdio: options.stdio ?? 'pipe',
  })
}

try {
  run('npm', ['pack', '--ignore-scripts', '--pack-destination', tmpRoot])

  const tarball = readdirSync(tmpRoot).find(file => file.endsWith('.tgz'))
  assert(tarball, 'npm pack did not create a package tarball')

  const tarballPath = join(tmpRoot, tarball)
  const consumerRoot = join(tmpRoot, 'consumer')
  mkdirSync(consumerRoot)

  writeFileSync(
    join(consumerRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  )

  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], {
    cwd: consumerRoot,
    stdio: 'inherit',
  })

  const packageRoot = join(consumerRoot, 'node_modules', 'ts-airtable')
  const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

  assert(packageJson.exports?.['.']?.import === './dist/index.js', 'ESM export entry is missing or incorrect')
  assert(packageJson.exports?.['.']?.require === './dist/index.cjs', 'CJS export entry is missing or incorrect')
  assert(packageJson.types === './dist/index.d.cts', 'package types entry is missing or incorrect')

  for (const file of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
  ]) {
    assert(existsSync(join(packageRoot, file)), `Packed package is missing ${file}`)
  }

  run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
        const mod = await import('ts-airtable')
        if (typeof mod.AirtableClient !== 'function') throw new Error('Missing AirtableClient ESM export')
        if (typeof mod.default?.configure !== 'function') throw new Error('Missing default Airtable facade export')
      `,
    ],
    { cwd: consumerRoot, stdio: 'inherit' },
  )

  run(
    process.execPath,
    [
      '--eval',
      `
        const mod = require('ts-airtable')
        if (typeof mod.AirtableClient !== 'function') throw new Error('Missing AirtableClient CJS export')
        if (typeof mod.default?.configure !== 'function') throw new Error('Missing default Airtable facade export')
      `,
    ],
    { cwd: consumerRoot, stdio: 'inherit' },
  )

  writeFileSync(
    join(consumerRoot, 'consumer.ts'),
    `
      import Airtable, { AirtableClient, type AirtableFieldSet } from 'ts-airtable'

      interface TaskFields extends AirtableFieldSet {
        Name: string
      }

      const client = new AirtableClient<TaskFields>({
        apiKey: 'key',
        baseId: 'appTest',
      })

      client.records
      Airtable.configure({ apiKey: 'key' })
    `,
  )

  run(
    join(repoRoot, 'node_modules', '.bin', 'tsc'),
    [
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      '--strict',
      '--noEmit',
      'consumer.ts',
    ],
    { cwd: consumerRoot, stdio: 'inherit' },
  )

  console.log(`Verified package contract with ${tarball}`)
}
finally {
  rmSync(tmpRoot, { recursive: true, force: true })
}
