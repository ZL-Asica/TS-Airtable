# Airtable TS

[![npm version][npm-version-badge]][npm-versions-link]
[![License][license-badge]][license-link]
[![Coverage][coverage-badge]][coverage-link]
[![Node.js][node-badge]][node-link]
[![pnpm Version][pnpm-badge]][pnpm-link] |
[![VitePress][vitepress-badge]][vitepress-link]
[![Vitest][vitest-badge]][vitest-link]
[![Eslint][eslint-badge]][eslint-link]

> A community maintained tiny, fetch-based JavaScript and TypeScript Airtable Web and Node API client.

📚 **[Documentation](https://airtable.zla.app)**

- [x] First-class **TypeScript**
- [x] Modern, promise-only API
- [x] Airtable.js-style façade (`Airtable.configure(...); Airtable.base(...)`)
- [x] Records + metadata + webhooks
- [x] Built-in retries with exponential backoff
- [x] Support Node, Web, Edge, and even more environments
- [x] Built-in pluggable **record caching** (with a built-in in-memory store)
- [x] Optional **attachment URL transformation** hook for re-hosting Airtable attachments (e.g. to S3 / R2 / your CDN)
- [ ] (WIP) Built-in logging interface to trigger logging when needed

It’s meant to be boring, predictable glue around Airtable’s HTTP API — no magic.

## Installation

```bash
pnpm add ts-airtable
# or
npm install ts-airtable
# or
yarn add ts-airtable
# or
bun add ts-airtable
# or deno
deno add npm:ts-airtable
```

> **Runtime:** Node 18+ (with built-in `fetch`) is recommended.
>
> On Node < 18, pass your own `fetch` (e.g. `undici`, `node-fetch`) in options.

## Quick start (Airtable.js-style façade)

High-level façade, compatible with the official [`airtable.js`](https://github.com/Airtable/airtable.js) style:

```ts
import Airtable from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  // endpointUrl?: 'https://api.airtable.com'
  // fetch?: typeof fetch
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
})

const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)

// List all records in a view
const records = await base('Tasks').select({ view: 'Grid view' }).all()
console.log(records[0].fields.Name)

// First page only
const firstPage = await base('Tasks').select({ pageSize: 50 }).firstPage()

// Single record
const rec = await base('Tasks').find('recXXXXXXXXXXXXXX')

// Create / update / delete
await base('Tasks').create([{ fields: { Name: 'Write docs', Status: 'Todo' } }])
await base('Tasks').update([{ id: 'rec1', fields: { Status: 'Done' } }])
await base('Tasks').destroy('rec1')
await base('Tasks').destroyMany(['rec2', 'rec3'])
```

### Shape of the façade

```ts
Airtable.configure({
  apiKey: string,
  endpointUrl?: string,
  fetch?: typeof fetch,
  maxRetries?: number,
  retryInitialDelayMs?: number,
  retryOnStatuses?: number[],
  // recordsCache?: AirtableRecordsCacheOptions (optional global records cache)
})

const base = Airtable.base<MyFields>(baseId /*, {
  // Optional per-base overrides (currently: recordsCache)
  // recordsCache?: AirtableRecordsCacheOptions
}*/)

// base is a function: base(tableName) -> table helper
base.id     // baseId
base.client // underlying AirtableClient instance

const table = base('Table name')
table.select(params).all()
table.select(params).firstPage()
table.find(recordId, params?)
table.create(records, options?)
table.update(records, options?)
table.updateRecord(recordId, fields, options?)
table.destroy(recordId)
table.destroyMany(recordIds)
```

If you only need to do **record listing + create / update / delete**, the façade is all you need.

## Low-level client (`AirtableClient`)

If you prefer a direct client (and full surface area: records + metadata + webhooks):

```ts
import { AirtableClient } from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  // endpointUrl?: string
  // fetch?: typeof fetch
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
})

const page = await client.records.listRecords('Tasks', {
  view: 'Grid view',
  pageSize: 50,
})

const schema = await client.metadata.getBaseSchema()
const webhooks = await client.webhooks.listWebhooks()
```

- `client.records` – list / get / create / update / delete / upsert
- `client.metadata` – bases, base schema, table & view metadata
- `client.webhooks` – create / list / refresh / delete + payload listing

## Optional record caching (overview)

Record caching for reads (`listRecords`, `listAllRecords`, `iterateRecords`, `getRecord`) is **opt-in** and configured via `recordsCache`.

A simple in-process LRU+TTL store is built in: `InMemoryCacheStore`.

```ts
import Airtable, { InMemoryCacheStore } from 'ts-airtable'

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  recordsCache: {
    store: new InMemoryCacheStore(),
    defaultTtlMs: 30_000,
  },
})

const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)
const records = await base('Tasks').select({ view: 'Grid view' }).all()
```

You can also configure caching directly on the low-level client:

```ts
import { AirtableClient, InMemoryCacheStore } from 'ts-airtable'

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  recordsCache: {
    store: new InMemoryCacheStore(),
    defaultTtlMs: 60_000,
  },
})
```

### Attachment URL transformation (advanced)

If your base uses **attachment fields**, you may want to avoid relying on Airtable’s
short-lived signed URLs when you cache records.

You can plug a custom `transformAttachment` function into your cache store:

```ts
import type {
  AirtableAttachment,
  AirtableAttachmentCacheContext,
  AirtableCacheStore,
} from 'ts-airtable'

const store: AirtableCacheStore = {
  // ... your get / set / delete / deleteByPrefix ...

  async transformAttachment(
    attachment: AirtableAttachment,
    ctx: AirtableAttachmentCacheContext,
  ): Promise<AirtableAttachment> {
    // Example: re-host to your own storage and return a new URL.
    // This is called before records are cached and returned.

    // TODO: download attachment.url, upload to S3/R2/etc, build stableUrl...
    const stableUrl = attachment.url // replace with your own URL

    return { ...attachment, url: stableUrl }
  },
}
```

The built-in `InMemoryCacheStore` ships with a simple ID-based memoization
for attachments (per-process) so that heavy transformations only run once per
`attachment.id`. For production setups (e.g. Cloudflare KV + R2) see:

- [Caching](https://airtable.zla.app/guide/features/caching)
- [Cloudflare KV / R2 cache store example](https://airtable.zla.app/guide/examples/custom-cache-store-cloudflare-kv)

## Error handling

All non-2xx responses are wrapped in `AirtableError`:

```ts
import { AirtableError, isAirtableError } from 'ts-airtable'

try {
  await client.records.listRecords('Tasks')
} catch (err) {
  if (isAirtableError(err)) {
    console.error('Airtable error', err.status, err.type, err.message)
  } else {
    console.error('Unexpected error', err)
  }
}
```

## Development

```bash
pnpm install

# Tests (Vitest)
pnpm test
pnpm test:coverage

# Lint / build
pnpm lint
pnpm build
```

## Contributing

Contributions are welcome! Check [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing. Feel free to open an issue or submit a PR. ❤️

## License

This is an unofficial community library and is not endorsed, sponsored, or affiliated with Airtable. Airtable is a registered trademark of Formagrid Inc.

This project is licensed under the [MIT License](./LICENSE).

<!-- Badges / Links -->

[coverage-badge]: https://img.shields.io/codecov/c/github/ZL-Asica/TS-Airtable
[coverage-link]: https://codecov.io/gh/ZL-Asica/TS-Airtable
[eslint-badge]: https://img.shields.io/badge/eslint-4B32C3?logo=eslint&logoColor=white
[eslint-link]: https://www.npmjs.com/package/eslint-config-zl-asica
[license-badge]: https://img.shields.io/github/license/ZL-Asica/TS-Airtable
[license-link]: https://github.com/ZL-Asica/TS-Airtable/blob/main/LICENSE
[node-badge]: https://img.shields.io/badge/node%3E=18-339933?logo=node.js&logoColor=white
[node-link]: https://nodejs.org/
[npm-version-badge]: https://img.shields.io/npm/v/ts-airtable
[npm-versions-link]: https://www.npmjs.com/package/ts-airtable
[pnpm-badge]: https://img.shields.io/github/package-json/packageManager/ZL-Asica/TS-Airtable?label=&logo=pnpm&logoColor=fff&color=F69220
[pnpm-link]: https://pnpm.io/
[vitepress-badge]: https://img.shields.io/badge/VitePress-5468ff?logo=vite&logoColor=ffffff
[vitepress-link]: https://vitepress.dev/
[vitest-badge]: https://img.shields.io/badge/vitest-6E9F18?logo=vitest&logoColor=white
[vitest-link]: https://vitest.dev/
