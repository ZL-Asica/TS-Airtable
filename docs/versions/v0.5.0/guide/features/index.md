---
title: Features overview
description: Optional and advanced features built on top of the core Airtable TS client, such as record caching.
---

# Features

This section covers **optional** and **advanced** features built on top of the
core Airtable TS client.

The core usage is:

- How to talk to Airtable (records / metadata / webhooks)
- How to configure the client (API key, base, fetch, retries)

Features in this section are **extra capabilities** you can turn on when you need them — they’re not required to use the library.

## Currently available

### Record caching

> Docs: [Caching](./caching.md)

Optional response caching for read operations:

- `listRecords`
- `listAllRecords`
- `iterateRecords` (first page)
- `getRecord`

Highlights:

- Pluggable `AirtableCacheStore` interface
- Built-in `InMemoryCacheStore` (LRU + TTL) for in-process caching
- Automatic invalidation on mutations when `deleteByPrefix` is implemented
- Configurable via:
  - `Airtable.configure({ recordsCache })`
  - `Airtable.base(baseId, { recordsCache })`
  - `new AirtableClient({ ..., recordsCache })`

If you just want a quick win (and no extra dependencies), start with the built-in in-memory store.
For details and best practices, see [Caching](./caching.md).

### Request observability

Production integrations usually need to answer questions like:

- Which Airtable request failed?
- Did the client retry it?
- Was it delayed by a scheduler or rate limiter?
- How long did the final attempt take?

Configure `observability` hooks on `Airtable.configure(...)` or
`new AirtableClient(...)` to receive request lifecycle events.

```ts
const client = new AirtableClient({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  observability: {
    onRequestEnd: event => console.info(event.method, event.status),
    onRetry: event => console.warn('retrying after', event.delayMs),
    onRateLimit: event => console.info('delayed by', event.delayMs),
    onError: event => console.error(event.error),
  },
})
```

The events include a stable `requestId`, base id, method, URL, attempt number
and timing/status details. API keys, request headers and request bodies are not
included. URLs can still include Airtable query values such as formulas, view
names, field names, and offsets, so redact them when needed.

### Request scheduling and rate limiting

Use `rateLimiter: true` when a single Node, Web or edge process should respect
Airtable's common 5 requests/second per-base limit.

```ts
const client = new AirtableClient({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  rateLimiter: true,
})
```

For shared throttling, distributed queues or tracing wrappers, provide a custom
`requestScheduler` instead.

```ts
import type { AirtableRequestScheduler } from 'ts-airtable'

const requestScheduler: AirtableRequestScheduler = {
  async schedule(run, context) {
    // Put queueing, distributed locks, tracing or circuit breakers here.
    return run()
  },
}
```

The built-in limiter is intentionally process-local. In multi-instance
deployments, share your own scheduler across instances if you need a global
limit.

### Webhook notification verification

Airtable webhook creation returns a `macSecretBase64`. Store it with the
webhook id and use it to verify notification requests before fetching payloads.

```ts
import {
  getAirtableWebhookContentMac,
  verifyAirtableWebhookNotification,
} from 'ts-airtable'

const rawBody = await request.text()
const notification = await verifyAirtableWebhookNotification({
  body: rawBody,
  macSecretBase64: process.env.AIRTABLE_WEBHOOK_MAC_SECRET_BASE64!,
  signature: getAirtableWebhookContentMac(request.headers),
})

await client.webhooks.listWebhookPayloads(notification.webhook.id)
```

Always use the raw request body for verification. See the [Webhooks guide](../webhooks.md)
for the full flow.

## How features are configured

Most features are enabled via **client options**:

- Globally (for the façade):

  ```ts
  Airtable.configure({
    apiKey: process.env.AIRTABLE_API_KEY!,
    // ...common options
    // recordsCache?: AirtableRecordsCacheOptions
    // rateLimiter?: true | AirtableRateLimiterOptions
    // observability?: AirtableObservabilityHooks
  })
  ```

- Per-base overrides (facade):

  ```ts
  const base = Airtable.base<MyFields>(process.env.AIRTABLE_BASE_ID!, {
    // e.g. base-specific records cache
    // recordsCache?: AirtableRecordsCacheOptions
  })
  ```

- Directly on the low-level client:

  ```ts
  const client = new AirtableClient<MyFields>({
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    // recordsCache?: AirtableRecordsCacheOptions
    // rateLimiter?: true | AirtableRateLimiterOptions
    // requestScheduler?: AirtableRequestScheduler
    // observability?: AirtableObservabilityHooks
  })
  ```

The idea is consistent: **core API first, features opt-in**.

## Where to go next

- ✅ New to the library? Start with [Getting Started](../getting-started.md)
- 📄 Want to work with data? See the [Records API](../records.md)
- 🧊 Need better performance / fewer API calls? Dive into [Caching](./caching.md)
- 📈 Need logs, metrics or throttling? Use request observability and rate limiting above
- 🧱 Need schemas & table info? Check out [Metadata](../metadata.md)
- 🔔 Need reactive workflows? See [Webhooks](../webhooks.md)
