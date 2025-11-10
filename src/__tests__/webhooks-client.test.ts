import { describe, expect, it, vi } from 'vitest'
import { AirtableWebhooksClient } from '@/client/webhooks-client'

describe('airtableWebhooksClient', () => {
  const makeCore = () => {
    return {
      baseId: 'appBase',
      buildBaseUrl: vi.fn((path: string, query?: URLSearchParams) => {
        const url = new URL(`https://example.com${path}`)
        if (query && Array.from(query.keys()).length > 0) {
          url.search = query.toString()
        }
        return url
      }),
      requestJson: vi.fn(),
    } as any
  }

  it('createWebhook posts to /webhooks with body', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'wh1',
      expirationTime: '2024-01-01T00:00:00.000Z',
    })

    const client = new AirtableWebhooksClient(core)

    const params = {
      notificationUrl: 'https://example.com/hook',
      specification: {
        options: {
          filters: {
            dataTypes: ['tableData'],
          },
        },
      },
    }

    const result = await client.createWebhook(params as any)

    expect(core.buildBaseUrl).toHaveBeenCalledWith('/webhooks')
    expect(core.requestJson).toHaveBeenCalledTimes(1)

    const [url, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toContain('/webhooks')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
    expect(result.id).toBe('wh1')
  })

  it('listWebhooks sends GET to /webhooks', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ webhooks: [] })

    const client = new AirtableWebhooksClient(core)
    await client.listWebhooks()

    expect(core.buildBaseUrl).toHaveBeenCalledWith('/webhooks')
    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('deleteWebhook throws when webhookId is missing', async () => {
    const core = makeCore()
    const client = new AirtableWebhooksClient(core)

    await expect(client.deleteWebhook('')).rejects.toThrow(
      'AirtableWebhooksClient.deleteWebhook: webhookId is required',
    )
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('deleteWebhook sends DELETE to /webhooks/{id}', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue(undefined)

    const client = new AirtableWebhooksClient(core)
    await client.deleteWebhook('wh_123')

    expect(core.buildBaseUrl).toHaveBeenCalledWith('/webhooks/wh_123')
    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('refreshWebhook throws when webhookId is missing', async () => {
    const core = makeCore()
    const client = new AirtableWebhooksClient(core)

    await expect(client.refreshWebhook('')).rejects.toThrow(
      'AirtableWebhooksClient.refreshWebhook: webhookId is required',
    )
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('refreshWebhook posts to /webhooks/{id}/refresh', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'wh1',
      expirationTime: '2024-01-01T00:00:00.000Z',
    })

    const client = new AirtableWebhooksClient(core)
    const result = await client.refreshWebhook('wh_123')

    expect(core.buildBaseUrl).toHaveBeenCalledWith('/webhooks/wh_123/refresh')
    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.id).toBe('wh1')
  })

  it('listWebhookPayloads throws when webhookId is missing', async () => {
    const core = makeCore()
    const client = new AirtableWebhooksClient(core)

    await expect(client.listWebhookPayloads('')).rejects.toThrow(
      'AirtableWebhooksClient.listWebhookPayloads: webhookId is required',
    )
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('listWebhookPayloads builds query with cursor and limit', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      cursor: 123,
      mightHaveMore: false,
      payloads: [],
    })

    const client = new AirtableWebhooksClient(core)

    await client.listWebhookPayloads('wh_123', { cursor: 5, limit: 50 })

    expect(core.buildBaseUrl).toHaveBeenCalledTimes(1)
    const [path, search] = core.buildBaseUrl.mock.calls[0] as [
      string,
      URLSearchParams,
    ]
    expect(path).toBe('/webhooks/wh_123/payloads')
    expect(search.get('cursor')).toBe('5')
    expect(search.get('limit')).toBe('50')

    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('listWebhookPayloads works when params is omitted (no cursor/limit)', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      cursor: 0,
      mightHaveMore: false,
      payloads: [],
    })

    const client = new AirtableWebhooksClient(core)
    await client.listWebhookPayloads('wh_no_params')

    expect(core.buildBaseUrl).toHaveBeenCalledTimes(1)
    const [path, search] = core.buildBaseUrl.mock.calls[0] as [
      string,
    URLSearchParams | undefined,
    ]

    expect(path).toBe('/webhooks/wh_no_params/payloads')

    // search may be undefined, or also may be URLSearchParams
    if (search) {
      expect(Array.from(search.keys()).length).toBe(0)
    }
  })
})
