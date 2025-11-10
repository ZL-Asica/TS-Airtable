import type { AirtableCoreClient } from './core'
import type {
  CreateWebhookParams,
  CreateWebhookResult,
  ListWebhookPayloadsParams,
  ListWebhookPayloadsResult,
  ListWebhooksResult,
} from '@/types'

/**
 * Webhooks API client.
 *
 * Composed into `AirtableClient` as `client.webhooks`.
 */
export class AirtableWebhooksClient {
  constructor(private readonly core: AirtableCoreClient) {}

  /**
   * Create a webhook on this base.
   *
   * Thin wrapper around the "Create a webhook" endpoint.
   *
   * @example
   * ```ts
   * const webhook = await client.createWebhook({
   *   notificationUrl: 'https://example.com/airtable-webhook',
   *   specification: {
   *     options: {
   *       filters: {
   *         dataTypes: ['tableData'],
   *         recordChangeScope: 'tblXXXXXXXXXXXXXX',
   *       },
   *     },
   *   },
   * })
   *
   * console.log(webhook.id, webhook.expirationTime)
   * ```
   */
  async createWebhook(
    params: CreateWebhookParams,
  ): Promise<CreateWebhookResult> {
    const url = this.core.buildBaseUrl('/webhooks')

    return this.core.requestJson<CreateWebhookResult>(url, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * List all webhooks configured on this base.
   *
   * Airtable currently returns all webhooks in a single page.
   */
  async listWebhooks(): Promise<ListWebhooksResult> {
    const url = this.core.buildBaseUrl('/webhooks')
    return this.core.requestJson<ListWebhooksResult>(url, {
      method: 'GET',
    })
  }

  /**
   * Delete a webhook by id.
   *
   * Deleting a webhook immediately stops notifications and
   * frees up one webhook slot on the base.
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    if (!webhookId) {
      throw new Error('AirtableWebhooksClient.deleteWebhook: webhookId is required')
    }

    const encoded = encodeURIComponent(webhookId)
    const url = this.core.buildBaseUrl(`/webhooks/${encoded}`)

    // The endpoint responds with 204 No Content on success.
    await this.core.requestJson<void>(url, { method: 'DELETE' })
  }

  /**
   * Refresh a webhook to extend its expiration time.
   *
   * Thin wrapper around the "Refresh a webhook" endpoint:
   * POST /v0/bases/{baseId}/webhooks/{webhookId}/refresh
   *
   * The response has the same shape as "Create a webhook"
   * (id, macSecretBase64, expirationTime).
   */
  async refreshWebhook(webhookId: string): Promise<CreateWebhookResult> {
    if (!webhookId) {
      throw new Error('AirtableWebhooksClient.refreshWebhook: webhookId is required')
    }

    const encoded = encodeURIComponent(webhookId)
    const url = this.core.buildBaseUrl(`/webhooks/${encoded}/refresh`)

    return this.core.requestJson<CreateWebhookResult>(url, {
      method: 'POST',
    })
  }

  /**
   * List webhook payloads for a given webhook.
   *
   * Use the `cursor` and `mightHaveMore` fields on the response
   * to paginate through all payloads. You are responsible for
   * persisting the cursor if you need exactly-once processing.
   *
   * @example
   * ```ts
   * let cursor: number | undefined
   *
   * do {
   *   const page = await client.listWebhookPayloads('achXXXXXXXXXXXXXX', {
   *     cursor,
   *     limit: 50,
   *   })
   *
   *   for (const payload of page.payloads) {
   *     // handle payload
   *   }
   *
   *   cursor = page.mightHaveMore ? page.cursor : undefined
   * } while (cursor != null)
   * ```
   */
  async listWebhookPayloads(
    webhookId: string,
    params?: ListWebhookPayloadsParams,
  ): Promise<ListWebhookPayloadsResult> {
    if (!webhookId) {
      throw new Error('AirtableWebhooksClient.listWebhookPayloads: webhookId is required')
    }

    const search = new URLSearchParams()
    if (params?.cursor != null) {
      search.set('cursor', String(params.cursor))
    }
    if (params?.limit != null) {
      search.set('limit', String(params.limit))
    }

    const encoded = encodeURIComponent(webhookId)
    const url = this.core.buildBaseUrl(`/webhooks/${encoded}/payloads`, search)

    return this.core.requestJson<ListWebhookPayloadsResult>(url, {
      method: 'GET',
    })
  }
}
