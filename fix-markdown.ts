import fs from 'node:fs'
import path from 'node:path'

const documentationDirectory = path.resolve('./docs/api')

// Counters for logging
let deletedReadmeFiles = 0
let processedFiles = 0
let renamedDirs = 0

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Any "index.md" (case-insensitive) is protected.
 * We never modify or delete those files.
 */
function isIndexFile(fileName: string): boolean {
  return fileName.toLowerCase() === 'index.md'
}

// ---------------------------------------------------------------------------
// Load package.json for "Defined in" → GitHub links
// ---------------------------------------------------------------------------

interface PackageJSON {
  version?: string
  repository?:
    | string
    | {
      url?: string
    }
}

let githubBlobBase: string | null = null

function initGithubBlobBase(): void {
  const pkgPath = path.resolve('./package.json')
  if (!fs.existsSync(pkgPath))
    return

  const raw = fs.readFileSync(pkgPath, 'utf8')
  const pkg = JSON.parse(raw) as PackageJSON

  const version = pkg.version
  if (!version)
    return

  let repoUrl = ''
  const repoField = pkg.repository
  if (typeof repoField === 'string') {
    repoUrl = repoField
  }
  else if (repoField && typeof repoField === 'object' && repoField.url) {
    repoUrl = repoField.url
  }

  if (!repoUrl)
    return

  // Normalize repository URL to https://github.com/owner/repo
  repoUrl = repoUrl
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')

  githubBlobBase = `${repoUrl}/blob/v${version}`
}

initGithubBlobBase()

// ---------------------------------------------------------------------------
// Directory normalization
// ---------------------------------------------------------------------------

const DIR_NAME_OVERRIDES: Record<string, string> = {
  classes: 'Classes',
  functions: 'Functions',
  interfaces: 'Interfaces',
  variables: 'Variables',
  modules: 'Modules',
}

/**
 * Normalize a directory name for display:
 * - "type-aliases" -> "Type Aliases"
 * - "classes"      -> "Classes"
 * - "meta-client"  -> "Meta Client"
 */
function normalizeDirName(name: string): string {
  if (DIR_NAME_OVERRIDES[name])
    return DIR_NAME_OVERRIDES[name]

  return name
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Rename top-level directories under docs/api and build a mapping
 * from old name -> new name.
 *
 * Example:
 *   classes      → Classes
 *   type-aliases → Type Aliases
 */
function renameDirectories(): Map<string, string> {
  const dirNameMap = new Map<string, string>()

  if (!fs.existsSync(documentationDirectory))
    return dirNameMap

  const entries = fs.readdirSync(documentationDirectory, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory())
      continue

    const oldName = entry.name
    const newName = normalizeDirName(oldName)

    if (newName && newName !== oldName) {
      const oldPath = path.join(documentationDirectory, oldName)
      const newPath = path.join(documentationDirectory, newName)

      fs.renameSync(oldPath, newPath)
      dirNameMap.set(oldName, newName)
      renamedDirs++
    }
  }

  return dirNameMap
}

// ---------------------------------------------------------------------------
// Restore API index file (Typedoc overwrites the folder each time)
// ---------------------------------------------------------------------------

const apiOutputDir = documentationDirectory // docs/api
const apiIndexTemplatePath = path.resolve('./docs/api.index.md')
const apiIndexOutputPath = path.join(apiOutputDir, 'index.md')

function restoreApiIndex(): void {
  if (!fs.existsSync(apiIndexTemplatePath)) {
    // No custom index template, nothing to restore.
    return
  }

  if (!fs.existsSync(apiOutputDir)) {
    fs.mkdirSync(apiOutputDir, { recursive: true })
  }

  const content = fs.readFileSync(apiIndexTemplatePath, 'utf8')
  fs.writeFileSync(apiIndexOutputPath, content, 'utf8')
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

const DROP_HEADING_PREFIXES = [
  '## Index',
  '## Table of contents',
  '### Functions',
  '### Variables',
  '### Types',
]

const HEADING_REPLACERS: Array<[RegExp, string]> = [
  [/^## Modules\b/, '# Documentation'],
  [/^# Class:\s*/, '# '],
  [/^# Interface:\s*/, '# '],
  [/^# Function:\s*/, '# '],
  [/^# Variable:\s*/, '# '],
  [/^# Type Alias:\s*/, '# '],
  [/^# Type:\s*/, '# '],
]

/**
 * Inline generic type signatures as code in normal text.
 *
 * Examples:
 *   "AirtableClient<TDefaultFields>()"
 *   → "`AirtableClient<TDefaultFields>()`"
 *
 *   "Some text AirtableQuery<TFields> here"
 *   → "Some text `AirtableQuery<TFields>` here"
 *
 * If the line already contains backticks, it is left untouched
 * to avoid breaking existing code formatting.
 */
function escapeTypeParameters(line: string): string {
  if (line.includes('`'))
    return line

  // Simple heuristic: Foo<...>, Foo<...>()
  return line.replace(
    /(\b[A-Z]\w*<[^>\s]+>(\(\))?)/g,
    '`$1`',
  )
}

/**
 * Transform "Defined in: ..." to a GitHub link if possible.
 *
 * - Reads repo + version from package.json
 * - Builds a link to the tagged blob: repo/blob/vX.Y.Z/path#Lline
 *
 * Examples of supported input:
 *   "Defined in: src/client/index.ts:31"
 *   "Defined in: [src/client/index.ts:31](some-local-link)"
 */
function transformDefinedInLine(line: string): string {
  if (!githubBlobBase)
    return line

  const prefix = 'Defined in:'
  if (!line.startsWith(prefix))
    return line

  const rest = line.slice(prefix.length).trim()
  if (!rest)
    return line

  let label = rest

  // If it is already a markdown link [text](...), strip down to text part
  if (label.startsWith('[')) {
    const closing = label.indexOf(']')
    if (closing !== -1) {
      label = label.slice(1, closing)
    }
  }

  // Expect something like "src/client/index.ts:31"
  const match = label.match(/^(.+):(\d+)\s*$/)
  if (!match)
    return line

  const filePath = match[1].trim()
  const lineNumber = match[2].trim()

  const url = `${githubBlobBase}/${filePath}#L${lineNumber}`

  return `${prefix} [${filePath}:${lineNumber}](${url})`
}

/**
 * Heuristically detect a breadcrumb line.
 *
 * Typedoc usually generates something like:
 *   [index](../index.md) / [Module](./module.md)
 */
function isBreadcrumbLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed)
    return false
  if (trimmed.startsWith('#'))
    return false
  if (!trimmed.includes(']('))
    return false
  if (!trimmed.includes('/'))
    return false
  return true
}

/**
 * Split optional frontmatter from the rest of the file.
 * Also normalizes the "title" field slightly:
 * - Removes "Class: ", "Interface: " etc prefixes
 * - Removes generic type arguments (<...> or \<...\>) from titles
 * - Removes backslashes in titles
 */
function splitFrontmatter(
  lines: string[],
): { frontmatter: string[], body: string[] } {
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { frontmatter: [], body: lines }
  }

  const frontmatter: string[] = []
  frontmatter.push('---')

  let i = 1
  for (; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (trimmed === '---') {
      frontmatter.push('---')
      i++
      break
    }

    let line = raw
    const titleMatch = trimmed.match(/^title:\s*(\S.*)$/)
    if (titleMatch) {
      let value = titleMatch[1].trim()

      // Strip quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith('\'') && value.endsWith('\''))
      ) {
        value = value.slice(1, -1)
      }

      // Drop "Class: ", "Interface: " etc prefixes
      value = value.replace(
        /^(Class|Interface|Function|Variable|Type Alias|Type):\s+/,
        '',
      )

      // Remove generic part in titles: "<...>" and "\<...\>"
      value = value.replace(/\\<[^>]+\\>/g, '')
      value = value.replace(/<[^>]+>/g, '')

      // Remove any leftover backslashes
      value = value.replace(/\\/g, '')

      line = `title: ${value}`
    }

    frontmatter.push(line)
  }

  const body = lines.slice(i)
  return { frontmatter, body }
}

/**
 * Rewrite local links according to directory rename mapping.
 *
 * Only touches markdown links:
 *   [text](relative/path.md)
 *
 * Skips:
 *   - http/https URLs
 *   - "#anchor" links
 */
function updateLinks(content: string, dirNameMap: Map<string, string>): string {
  if (dirNameMap.size === 0)
    return content

  return content.replace(/\]\(([^)]+)\)/g, (full, rawTarget: string) => {
    const target = String(rawTarget).trim()

    // Skip external links and pure anchors
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('#'))
      return full

    const [pathPart, hashPart] = target.split('#')
    const segments = pathPart.split('/')

    let changed = false
    const newSegments = segments.map((seg) => {
      const replacement = dirNameMap.get(seg)
      if (replacement && replacement !== seg) {
        changed = true
        return replacement
      }
      return seg
    })

    if (!changed)
      return full

    const newPath = newSegments.join('/') + (hashPart ? `#${hashPart}` : '')
    return `](${newPath})`
  })
}

/**
 * Fix a single markdown file:
 * - Drop Typedoc's "Index"/"Functions"/"Types" headings
 * - Remove breadcrumb line(s) and top-level "***" before the first heading
 * - Normalize top-level headings (Class:/Interface:/etc)
 * - Remove generic type arguments from headings:
 *     "# AirtableClient<TDefaultFields>()"  → "# AirtableClient()"
 *     "# AirtableClient\<TDefaultFields\>()" → "# AirtableClient()"
 *     "# AirtableQuery<TFields>"            → "# AirtableQuery"
 * - Remove all "\" characters from headings (to avoid escaped angle brackets)
 * - In body lines, wrap generic tokens in inline code:
 *     "AirtableQuery<TFields>" → "`AirtableQuery<TFields>`"
 * - Turn "Defined in: ..." lines into GitHub links
 * - Keep everything after "## Example" mostly untouched
 * - Update local links to reflect renamed directories
 */
function fixMarkdown(filePath: string, dirNameMap: Map<string, string>): void {
  const original = fs.readFileSync(filePath, 'utf8')
  const lines = original.split(/\r?\n/)

  const { frontmatter, body } = splitFrontmatter(lines)

  const resultBodyLines: string[] = []
  let skipProcessing = false
  let sawHeading = false

  for (const rawLine of body) {
    let line = rawLine

    // Always transform "Defined in" lines (even if skipping other transforms)
    line = transformDefinedInLine(line)

    // Remove breadcrumb & stray "***" BEFORE first heading
    if (!sawHeading) {
      if (isBreadcrumbLine(line))
        continue
      if (line.trim() === '***')
        continue
    }

    if (skipProcessing) {
      resultBodyLines.push(line)
      continue
    }

    // Drop Typedoc's index headings and function/type lists
    if (DROP_HEADING_PREFIXES.some(prefix => line.startsWith(prefix))) {
      continue
    }

    // Everything after "## Example" is kept as-is (besides "Defined in")
    if (line.startsWith('## Example')) {
      skipProcessing = true
      resultBodyLines.push(line)
      continue
    }

    // Normalize headings like "# Class: Foo" → "# Foo"
    for (const [pattern, replacement] of HEADING_REPLACERS) {
      if (pattern.test(line)) {
        line = line.replace(pattern, replacement)
        break
      }
    }

    // Simple cleanup
    line = line.replace(/README\.md/g, '')

    if (line.startsWith('#')) {
      // Heading: remove generic parts "<...>" and "\<...\>"
      line = line.replace(/\\<[^>]+\\>/g, '')
      line = line.replace(/<[^>]+>/g, '')

      // Remove any remaining backslashes in headings
      line = line.replace(/\\/g, '')

      sawHeading = true
    }
    else {
      // Body text: wrap "Foo<T>()" / "Foo<T>" in inline code
      line = escapeTypeParameters(line)
    }

    resultBodyLines.push(line)
  }

  const combinedLines
    = frontmatter.length > 0 ? [...frontmatter, ...resultBodyLines] : resultBodyLines

  let fixed = `${combinedLines.join('\n').trimEnd()}\n`
  fixed = `${updateLinks(fixed, dirNameMap).trim()}\n`

  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8')
  }

  processedFiles++
}

/**
 * Traverse docs/api and:
 * - Skip ANY index.md (do not modify or delete)
 * - Delete Typedoc-generated README.md files
 * - Fix all other markdown files
 */
function traverseDocuments(
  directory: string,
  dirNameMap: Map<string, string>,
): void {
  if (!fs.existsSync(directory))
    return

  const entries = fs.readdirSync(directory, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      traverseDocuments(fullPath, dirNameMap)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md'))
      continue

    // 1) Never touch any index.md (root or nested)
    if (isIndexFile(entry.name))
      continue

    // 2) Remove Typedoc README.md
    if (entry.name === 'README.md') {
      fs.unlinkSync(fullPath)
      deletedReadmeFiles++
      continue
    }

    // 3) Fix all other markdown files
    fixMarkdown(fullPath, dirNameMap)
  }
}

// ---------------------------------------------------------------------------
// Run the script
// ---------------------------------------------------------------------------

// First, rename top-level directories and build the name mapping
const dirNameMap = renameDirectories()

// Then, traverse and process markdown files
traverseDocuments(documentationDirectory, dirNameMap)

// Finally, restore our custom docs/api/index.md
restoreApiIndex()

let msg = `Processed ${processedFiles} markdown file(s).`
if (deletedReadmeFiles > 0)
  msg += ` Deleted ${deletedReadmeFiles} README.md file(s).`
if (renamedDirs > 0)
  msg += ` Renamed ${renamedDirs} directorie(s).`

// eslint-disable-next-line no-console
console.log(msg)
