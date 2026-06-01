---
layout: home
title: Airtable TS
description: A tiny, fetch-based JavaScript and TypeScript client for the Airtable Web API.
hero:
  name: Airtable TS
  text: A tiny Airtable client for TypeScript runtimes.
  tagline: Use the familiar Airtable.js facade when you want it, or drop down to typed records, metadata, webhooks, retries, and cache controls when you need more.
  image:
    src: /web-app-manifest-512x512.png
    alt: Airtable TS
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/
features:
  - title: Familiar Airtable.js flow
    details: Configure once, call base(tableName), and keep the simple select/find/create/update/destroy workflow.
  - title: Typed low-level client
    details: Work directly with records, metadata, and webhooks while keeping Airtable response shapes visible.
  - title: Fetch-first runtime support
    details: Runs in Node 18+, modern browsers, and edge runtimes that provide the standard fetch API.
  - title: Robust by default
    details: Handles Retry-After, retryable failures, Airtable error payloads, and long list queries via POST /listRecords.
  - title: Optional record caching
    details: Add a cache store when reads are hot, with mutation-aware invalidation and attachment transform hooks.
  - title: Small package surface
    details: Promise-only APIs, no legacy callback layer, and exports that are easy to test in ESM and CJS projects.
---

## Pick The Right Entry Point

- Start with [Getting Started](./guide/getting-started.md) if you are installing
  the package or moving from the official Airtable client.
- Use the [Records guide](./guide/records.md) for list pagination, CRUD,
  batch updates, and upserts.
- Use [Metadata](./guide/metadata.md) and [Webhooks](./guide/webhooks.md) when
  you need base structure or change notifications.
- Use the [API Reference](./api/index.md) when you already know the export or
  option name you are looking for.

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

## Package Links

- [npm package](https://www.npmjs.com/package/ts-airtable)
- [GitHub repository](https://github.com/ZL-Asica/TS-Airtable)
- [Changelog](https://github.com/ZL-Asica/TS-Airtable/blob/main/CHANGELOG.md)

## License And Trademark

This is an unofficial community library and is not endorsed, sponsored, or
affiliated with Airtable. Airtable is a registered trademark of Formagrid Inc.

This project is licensed under the [MIT License](https://github.com/ZL-Asica/TS-Airtable/blob/main/LICENSE).
