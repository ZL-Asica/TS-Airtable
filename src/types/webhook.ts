/**
 * Filters used inside the webhook specification.
 * This is a lightly-typed mirror of Airtable's Webhooks filters.
 *
 * See: https://airtable.com/developers/web/api/model/webhooks-specification
 */
export interface AirtableWebhookFilters {
  /**
   * Data types this webhook should receive changes for.
   * Common values include "tableData".
   */
  dataTypes?: string[]

  /**
   * Limit notifications to changes in a particular table, given by its ID.
   * For example: "tblXXXXXXXXXXXXXX".
   */
  recordChangeScope?: string

  /**
   * Restrict notifications to specific change types.
   * Common values include "create", "update", "delete".
   */
  changeTypes?: string[]

  /**
   * Restrict notifications to changes coming from particular sources.
   * For example: "publicApi", "web", "mobile".
   */
  fromSources?: string[]

  /**
   * Any extra filter properties supported by Airtable.
   */
  [key: string]: unknown
}

/**
 * Webhook specification passed when creating a webhook.
 *
 * This is intentionally not fully closed over – you can add extra fields
 * according to Airtable's official Webhooks specification.
 *
 * See: https://airtable.com/developers/web/api/model/webhooks-specification
 */
export interface AirtableWebhookSpecification {
  /**
   * Options object, typically containing filters.
   */
  options?: {
    filters?: AirtableWebhookFilters
    [key: string]: unknown
  }

  /**
   * Optional scope configuration (for example, scoping to a view or table).
   */
  scope?: Record<string, unknown>

  /**
   * Additional forward-compatible fields.
   */
  [key: string]: unknown
}

/**
 * Parameters for creating a webhook on a base.
 */
export interface CreateWebhookParams {
  /**
   * Optional URL that Airtable will POST webhook pings to.
   *
   * If omitted, you can still poll changes using the
   * "List webhook payloads" endpoint.
   */
  notificationUrl?: string | null

  /**
   * Webhook configuration that describes which changes you want
   * to listen for. Must follow Airtable's Webhooks specification.
   */
  specification: AirtableWebhookSpecification
}

/**
 * Response returned when a webhook is created.
 *
 * See "Create a webhook" in Airtable Web API docs.
 */
export interface CreateWebhookResult {
  /**
   * Identifier of the webhook, e.g. "achXXXXXXXXXXXXXX".
   */
  id: string

  /**
   * Secret to validate webhook signatures.
   * See Airtable docs for how to verify webhook requests.
   */
  macSecretBase64: string

  /**
   * ISO 8601 timestamp when this webhook will expire
   * unless it is refreshed.
   */
  expirationTime: string

  /**
   * Additional forward-compatible fields.
   */
  [key: string]: unknown
}

/**
 * A webhook configured on a base.
 *
 * See "List webhooks" in Airtable Web API docs.
 */
export interface AirtableWebhook {
  id: string
  notificationUrl?: string
  /**
   * Whether notification pings are enabled for this webhook.
   */
  areNotificationsEnabled: boolean
  /**
   * Whether the webhook itself is enabled.
   * Airtable may disable a webhook automatically when it becomes invalid.
   */
  isHookEnabled: boolean
  /**
   * When this webhook will expire unless it is refreshed.
   */
  expirationTime: string
  /**
   * Cursor associated with the next payload that will be generated.
   * Used together with the "List webhook payloads" endpoint.
   */
  cursorForNextPayload: number
  /**
   * Timestamp of the last successful notification, if any.
   */
  lastSuccessfulNotificationTime?: string | null
  /**
   * Information about the last notification attempt, if any.
   */
  lastNotificationResult?: {
    completionTimestamp?: string
    durationMs?: number
    retryNumber?: number
    success?: boolean
    [key: string]: unknown
  } | null

  /**
   * The specification originally used to create the webhook.
   */
  specification: AirtableWebhookSpecification

  /**
   * Additional forward-compatible fields.
   */
  [key: string]: unknown
}

/**
 * Response shape for listing webhooks on a base.
 */
export interface ListWebhooksResult {
  webhooks: AirtableWebhook[]
}

/**
 * Result returned when deleting a webhook.
 *
 * Airtable currently responds with HTTP 204 and an empty body,
 * but this type is kept here for forward-compatibility.
 */
export interface DeleteWebhookResult {
  deleted?: boolean
  [key: string]: unknown
}

/**
 * Single webhook payload describing a batch of changes in a base.
 *
 * For the full schema see:
 * https://airtable.com/developers/web/api/model/webhooks-payload
 */
export interface AirtableWebhookPayload {
  /**
   * When the underlying change occurred.
   */
  timestamp: string

  /**
   * Monotonically increasing transaction number within the base.
   */
  baseTransactionNumber: number

  /**
   * Metadata about where the change came from (web, API, automation, etc).
   */
  actionMetadata?: {
    source?: string
    sourceMetadata?: {
      user?: {
        id?: string
        email?: string
        permissionLevel?: string
        name?: string
        profilePicUrl?: string
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    [key: string]: unknown
  }

  /**
   * Payload format identifier (e.g. "v0").
   */
  payloadFormat: string

  /**
   * Map of table IDs to change information.
   * The inner structure is quite rich; see Airtable docs for details.
   */
  changedTablesById?: Record<string, unknown>

  /**
   * Newly created tables, keyed by table ID.
   */
  createdTablesById?: Record<string, unknown>

  /**
   * IDs of tables that were deleted.
   */
  destroyedTableIds?: string[]

  /**
   * Error information in case something went wrong.
   */
  error?: unknown
  errorCode?: string | null

  /**
   * Additional forward-compatible fields.
   */
  [key: string]: unknown
}

/**
 * Parameters for listing webhook payloads.
 *
 * Used with the "List webhook payloads" endpoint.
 */
export interface ListWebhookPayloadsParams {
  /**
   * Cursor for the first payload to retrieve.
   * If omitted, Airtable will return the earliest available payloads.
   */
  cursor?: number

  /**
   * Maximum number of payloads to return in a single call.
   */
  limit?: number
}

/**
 * Response shape for "List webhook payloads".
 *
 * See: https://airtable.com/developers/web/api/list-webhook-payloads
 */
export interface ListWebhookPayloadsResult {
  payloads: AirtableWebhookPayload[]
  /**
   * Cursor you can pass to the next call to continue reading.
   */
  cursor?: number
  /**
   * Whether there might be more payloads available.
   */
  mightHaveMore?: boolean
  /**
   * Payload format identifier (e.g. "v0").
   */
  payloadFormat?: string
}
