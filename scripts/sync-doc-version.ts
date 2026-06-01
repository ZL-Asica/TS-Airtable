import type { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

type DocsChannel = 'stable' | 'prerelease'

interface PackageJson {
  version?: string
}

interface DocsVersionEntry {
  version: string
  channel: DocsChannel
  label: string
  path: string
  npmTag: 'latest' | 'beta'
  generatedFrom: string
  date: string
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(repoRoot, 'docs')
const versionsRoot = path.join(docsRoot, 'versions')
const manifestPath = path.join(docsRoot, 'versions.json')

function parseArgs(): { fromRef?: string, version?: string } {
  const args = process.argv.slice(2)
  const result: { fromRef?: string, version?: string } = {}

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--from-ref') {
      result.fromRef = args[++index]
    }
    else if (arg === '--version') {
      result.version = args[++index]
    }
    else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return result
}

function readPackageVersion(): string {
  const raw = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
  const pkg = JSON.parse(raw) as PackageJson

  if (!pkg.version)
    throw new Error('package.json is missing a version')

  return pkg.version
}

function normalizeVersion(version: string): string {
  return version.startsWith('v') ? version : `v${version}`
}

function versionChannel(version: string): DocsChannel {
  return version.includes('-') ? 'prerelease' : 'stable'
}

function shouldCopyDocsFile(relativePath: string): boolean {
  const parts = relativePath.split(path.sep)
  const first = parts[0]
  const basename = path.basename(relativePath)

  return Boolean(
    relativePath
    && first !== '.vitepress'
    && first !== 'public'
    && first !== 'versions'
    && relativePath !== 'versions.json'
    && relativePath !== 'api.index.md'
    && basename !== '.DS_Store',
  )
}

function listCurrentDocsFiles(root: string): string[] {
  const files: string[] = []

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name)
      const relativePath = path.relative(root, absolutePath)

      if (entry.isDirectory()) {
        if (shouldCopyDocsFile(relativePath))
          walk(absolutePath)
        continue
      }

      if (entry.isFile() && shouldCopyDocsFile(relativePath))
        files.push(relativePath)
    }
  }

  walk(root)
  return files.sort()
}

function listDocsFilesFromRef(ref: string): string[] {
  const output = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'docs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })

  return output
    .split('\n')
    .filter(Boolean)
    .map(filePath => filePath.replace(/^docs\//, ''))
    .filter(shouldCopyDocsFile)
    .sort()
}

function readFileFromRef(ref: string, relativePath: string): Buffer {
  return execFileSync('git', ['show', `${ref}:docs/${relativePath}`], {
    cwd: repoRoot,
  })
}

function latestCommitDate(ref: string): string {
  return execFileSync('git', ['log', '-1', '--format=%cs', ref], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim()
}

function copyCurrentDocs(targetRoot: string): number {
  const files = listCurrentDocsFiles(docsRoot)

  for (const relativePath of files) {
    const sourcePath = path.join(docsRoot, relativePath)
    const targetPath = path.join(targetRoot, relativePath)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  }

  return files.length
}

function copyDocsFromRef(ref: string, targetRoot: string): number {
  const files = listDocsFilesFromRef(ref)

  for (const relativePath of files) {
    const targetPath = path.join(targetRoot, relativePath)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.writeFileSync(targetPath, readFileFromRef(ref, relativePath))
  }

  return files.length
}

function writeSnapshotIndex(targetRoot: string, entry: DocsVersionEntry): void {
  const status = entry.channel === 'prerelease'
    ? 'This is a prerelease documentation snapshot. APIs may still change before the next stable release.'
    : 'This is a stable documentation snapshot for the published npm release.'
  const hasApiReference = fs.existsSync(path.join(targetRoot, 'api/index.md'))
  const apiReferenceLink = hasApiReference
    ? '- [API Reference](./api/index.md)'
    : '- API Reference was not generated for this historical snapshot.'

  const content = `---
title: Airtable TS ${entry.version}
description: Documentation snapshot for Airtable TS ${entry.version}.
---

# Airtable TS ${entry.version}

${status}

Generated from \`${entry.generatedFrom}\` on ${entry.date}.

## Start Here

- [Getting Started](./guide/getting-started.md)
- [Records API](./guide/records.md)
- [Metadata](./guide/metadata.md)
- [Webhooks](./guide/webhooks.md)
${apiReferenceLink}

## Version Channel

- Channel: **${entry.channel}**
- npm tag: \`${entry.npmTag}\`
- Snapshot path: \`${entry.path}\`
`

  fs.writeFileSync(path.join(targetRoot, 'index.md'), content, 'utf8')
}

function listMarkdownFiles(root: string): string[] {
  const files: string[] = []

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        walk(absolutePath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.md'))
        files.push(absolutePath)
    }
  }

  walk(root)
  return files
}

function removeMissingApiLinks(targetRoot: string): void {
  const apiIndexPath = path.join(targetRoot, 'api/index.md')
  if (fs.existsSync(apiIndexPath))
    return

  for (const filePath of listMarkdownFiles(targetRoot)) {
    const content = fs.readFileSync(filePath, 'utf8')
    const nextContent = content.replace(
      /\[([^\]]*API reference[^\]]*)\]\((?:\.\.\/|\.)?api\/index\.md\)/gi,
      '$1 (not generated for this historical snapshot)',
    )

    if (nextContent !== content)
      fs.writeFileSync(filePath, nextContent, 'utf8')
  }
}

function readManifest(): DocsVersionEntry[] {
  if (!fs.existsSync(manifestPath))
    return []

  const raw = fs.readFileSync(manifestPath, 'utf8')
  return JSON.parse(raw) as DocsVersionEntry[]
}

function compareVersionsDesc(left: string, right: string): number {
  const parse = (value: string) => {
    const [core, prerelease = ''] = value.replace(/^v/, '').split('-', 2)
    return {
      core: core.split('.').map(Number),
      prerelease,
    }
  }
  const a = parse(left)
  const b = parse(right)

  for (let index = 0; index < 3; index++) {
    const diff = (b.core[index] || 0) - (a.core[index] || 0)
    if (diff !== 0)
      return diff
  }

  if (!a.prerelease && b.prerelease)
    return -1
  if (a.prerelease && !b.prerelease)
    return 1

  return b.prerelease.localeCompare(a.prerelease)
}

function writeManifest(nextEntry: DocsVersionEntry): void {
  const entries = readManifest()
    .filter(entry => entry.version !== nextEntry.version)
    .concat(nextEntry)
    .sort((left, right) => compareVersionsDesc(left.version, right.version))

  fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
}

function main(): void {
  const { fromRef, version: requestedVersion } = parseArgs()
  const version = normalizeVersion(requestedVersion || readPackageVersion())
  const channel = versionChannel(version)
  const targetRoot = path.join(versionsRoot, version)
  const generatedFrom = fromRef || version
  const date = fromRef ? latestCommitDate(fromRef) : latestCommitDate('HEAD')

  fs.rmSync(targetRoot, { recursive: true, force: true })
  fs.mkdirSync(targetRoot, { recursive: true })

  const copied = fromRef
    ? copyDocsFromRef(fromRef, targetRoot)
    : copyCurrentDocs(targetRoot)

  removeMissingApiLinks(targetRoot)

  const entry: DocsVersionEntry = {
    version,
    channel,
    label: channel === 'prerelease' ? `${version} prerelease` : `${version} stable`,
    path: `/versions/${version}/`,
    npmTag: channel === 'prerelease' ? 'beta' : 'latest',
    generatedFrom,
    date,
  }

  writeSnapshotIndex(targetRoot, entry)
  writeManifest(entry)

  console.log(`Synced ${copied} documentation file(s) into ${path.relative(repoRoot, targetRoot)}`)
}

main()
