---
title: Airtable TS
description: A tiny, fetch-based JavaScript and TypeScript client for the Airtable Web API.
outline: deep
---

# Airtable TS

Airtable TS is a small, fetch-based client for the Airtable Web API. It gives
you an Airtable.js-style facade for everyday record work and a typed low-level
client for records, metadata, webhooks, retries, and optional record caching.

## Choose Your Starting Point

| Goal | Start here |
| --- | --- |
| Install the package and list records | [Getting Started](./guide/getting-started.md) |
| Read, paginate, create, update, delete, or upsert records | [Records API](./guide/records.md) |
| Inspect bases, tables, fields, and views | [Metadata](./guide/metadata.md) |
| Create and consume Airtable webhooks | [Webhooks](./guide/webhooks.md) |
| Cache Airtable record reads safely | [Caching](./guide/features/caching.md) |
| Check exported classes, types, and options | [API Reference](./api/index.md) |

## Quick Example

```ts
import Airtable from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
})

const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)
const records = await base('Tasks').select({ view: 'Grid view' }).all()

console.log(records[0]?.fields.Name)
```

## What This Client Focuses On

- **Fetch-first runtime support.** The package runs in Node 18+, modern
  browsers, and edge runtimes that provide the standard `fetch` API.
- **Official-client familiarity.** The facade keeps the familiar
  `Airtable.configure(...); Airtable.base(...)(tableName)` flow while staying
  small and promise-only.
- **Direct Web API coverage.** The low-level `AirtableClient` exposes records,
  metadata, and webhooks without hiding Airtable's response shapes.
- **Robust request behavior.** The client handles retryable failures,
  `Retry-After`, long list URLs via `POST /listRecords`, and JSON-shaped
  Airtable error payloads from imperfect mocks or proxies.
- **Optional caching.** Record reads can use a pluggable cache store with
  automatic invalidation on mutations.

## Versioned Documentation

The live root of this site follows the current repository version. Published
snapshots are kept under [Versions](./versions/index.md) so stable and
prerelease documentation can be compared after a new release is deployed.

## Package Links

- [npm package](https://www.npmjs.com/package/ts-airtable)
- [GitHub repository](https://github.com/ZL-Asica/TS-Airtable)
- [Changelog](https://github.com/ZL-Asica/TS-Airtable/blob/main/CHANGELOG.md)

## License And Trademark

This is an unofficial community library and is not endorsed, sponsored, or
affiliated with Airtable. Airtable is a registered trademark of Formagrid Inc.

This project is licensed under the [MIT License](https://github.com/ZL-Asica/TS-Airtable/blob/main/LICENSE).
