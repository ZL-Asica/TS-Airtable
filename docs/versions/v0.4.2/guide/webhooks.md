---
title: Webhooks
description: Learn how to use the Webhooks API in Airtable TS to create, manage, and consume webhooks for your Airtable bases.
---

# Webhooks

The **webhooks API** lets you subscribe to changes in a base and process them
from your backend. All webhook operations live under `client.webhooks`.

> Webhooks are **base-level**, not table-level.
>
> You must have a base id and an API token that is allowed to manage webhooks.

## Creating a webhook

```ts
const webhook = await client.webhooks.createWebhook({
  notificationUrl: 'https://example.com/airtable-webhook',
  specification: {
    options: {
      filters: {
        dataTypes: ['tableData'],
        recordChangeScope: 'tblXXXXXXXXXXXXXX', // table id
      },
    },
  },
})

console.log(webhook.id)
console.log(webhook.expirationTime)
console.log(webhook.macSecretBase64)
```

You’ll typically:

1. Store `webhook.id` and `macSecretBase64` in your database
2. Use `macSecretBase64` to verify incoming signatures from Airtable

## Listing webhooks

```ts
const { webhooks } = await client.webhooks.listWebhooks()

for (const w of webhooks) {
  console.log(w.id, w.notificationUrl, w.expirationTime)
}
```

Airtable currently returns all webhooks for a base in a single page.

## Refreshing a webhook

Webhooks expire. Use `refreshWebhook` to extend their lifetime:

```ts
const refreshed = await client.webhooks.refreshWebhook('achXXXXXXXXXXXXXX')

console.log('New expiration:', refreshed.expirationTime)
```

If you store `expirationTime`, you can schedule a job to refresh just before it expires.

## Deleting a webhook

```ts
await client.webhooks.deleteWebhook('achXXXXXXXXXXXXXX')
```

Once deleted:

- AirTable will stop sending notifications
- A slot is freed on that base (there is a limit per base)

## Consuming webhook payloads

Airtable **does not** guarantee “deliver everything exactly once” via HTTP alone.
Instead, you fetch **payloads** from the API and manage a cursor yourself.

```ts
let cursor: number | undefined

do {
  const page = await client.webhooks.listWebhookPayloads('achXXXXXXXXXXXXXX', {
    cursor,
    limit: 50,
  })

  for (const payload of page.payloads) {
    // handle payload
    // payloads contain events like record creation / updates
  }

  cursor = page.mightHaveMore ? page.cursor : undefined
} while (cursor != null)
```

`listWebhookPayloads` parameters:

```ts
interface ListWebhookPayloadsParams {
  cursor?: number // start from a previous cursor
  limit?: number // page size
}
```

Recommended pattern:

1. Store `cursor` after each successful processing batch
2. On restart / deploy, resume from the stored cursor
3. Ensure handlers are idempotent (payloads can be re-played)

## Typical setup

In a real project you might:

1. Create the webhook **once** (CLI or admin endpoint)
2. Store its `id`, `macSecretBase64`, and `expirationTime`
3. Run a background job that:
   - periodically calls `listWebhookPayloads`
   - processes events
   - saves the updated `cursor`

4. Run another job that:
   - checks `expirationTime`
   - calls `refreshWebhook` when necessary
