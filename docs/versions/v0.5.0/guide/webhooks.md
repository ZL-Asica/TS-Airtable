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

## Verifying notification signatures

Airtable signs webhook notification requests with `X-Airtable-Content-MAC`.
Verify that signature before trusting the request body.

Pass the exact raw request body bytes to the verifier. Do not parse JSON and
then stringify it again before verification; even harmless whitespace changes
will change the HMAC input.

```ts
import {
  getAirtableWebhookContentMac,
  verifyAirtableWebhookNotification,
} from 'ts-airtable'

async function handleAirtableWebhook(request: Request) {
  const rawBody = await request.text()

  const notification = await verifyAirtableWebhookNotification({
    body: rawBody,
    macSecretBase64: process.env.AIRTABLE_WEBHOOK_MAC_SECRET_BASE64!,
    signature: getAirtableWebhookContentMac(request.headers),
  })

  const page = await client.webhooks.listWebhookPayloads(notification.webhook.id, {
    limit: 50,
  })

  return Response.json({
    baseId: notification.base.id,
    webhookId: notification.webhook.id,
    payloadCount: page.payloads.length,
  })
}
```

The verified notification only tells you which base and webhook changed. Fetch
the actual changes with `client.webhooks.listWebhookPayloads(...)` and track a
cursor as described below.

Available helpers:

- `getAirtableWebhookContentMac(headers)` reads the signature header from a
  `Headers` object or plain header record.
- `verifyAirtableWebhookSignature(...)` returns a boolean when you only need
  signature validation.
- `verifyAirtableWebhookNotification(...)` verifies the signature and parses
  the minimal notification body.
- `AirtableWebhookVerificationError` is thrown for invalid JSON, invalid
  notification shape, failed signatures, or missing runtime crypto support.

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
