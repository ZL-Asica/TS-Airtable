# Airtable TS

[![npm version][npm-version-badge]][npm-versions-link]
[![License][license-badge]][license-link]
[![Coverage][coverage-badge]][coverage-link]
[![Node.js][node-badge]][node-link]
[![pnpm Version][pnpm-badge]][pnpm-link] |
[![VitePress][vitepress-badge]][vitepress-link]
[![Vitest][vitest-badge]][vitest-link]
[![Eslint][eslint-badge]][eslint-link]

A tiny, fetch-based JavaScript/TypeScript Airtable Web API client:

- [x] First-class **TypeScript**
- [x] Modern, promise-only API
- [x] Airtable.js-style façade (`Airtable.configure(...); Airtable.base(...)`)
- [x] Records + metadata + webhooks
- [x] Built-in retries with exponential backoff

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
  // endpointUrl: 'https://api.airtable.com', // optional override
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

```typescript
Airtable.configure({
  apiKey: string,
  endpointUrl?: string,
  fetch?: typeof fetch,
  maxRetries?: number,
  retryInitialDelayMs?: number,
  retryOnStatuses?: number[],
})

const base = Airtable.base<MyFields>(baseId)

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

## Error handling

All non-2xx responses are wrapped in `AirtableError`:

```ts
import { AirtableError, isAirtableError } from 'ts-airtable'

try {
  await client.records.listRecords('Tasks')
}
catch (err) {
  if (isAirtableError(err)) {
    console.error('Airtable error', err.status, err.type, err.message)
  }
  else {
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
[npm-version-badge]: https://img.shields.io/npm/v/tS-Airtable
[npm-versions-link]: https://www.npmjs.com/package/tS-Airtable
[pnpm-badge]: https://img.shields.io/github/package-json/packageManager/ZL-Asica/TS-Airtable?label=&logo=pnpm&logoColor=fff&color=F69220
[pnpm-link]: https://pnpm.io/
[vitepress-badge]: https://img.shields.io/badge/VitePress-5468ff?logo=vite&logoColor=ffffff
[vitepress-link]: https://vitepress.dev/
[vitest-badge]: https://img.shields.io/badge/vitest-6E9F18?logo=vitest&logoColor=white
[vitest-link]: https://vitest.dev/
