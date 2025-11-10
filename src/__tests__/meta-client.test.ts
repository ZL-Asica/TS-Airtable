import { describe, expect, it, vi } from 'vitest'
import { AirtableMetadataClient } from '@/client/meta-client'

describe('airtableMetadataClient', () => {
  const makeCore = () => {
    return {
      baseId: 'appBase',
      buildMetaUrl: vi.fn((path: string, query?: URLSearchParams) => {
        const url = new URL(`https://example.com${path}`)
        if (query && Array.from(query.keys()).length > 0) {
          url.search = query.toString()
        }
        return url
      }),
      requestJson: vi.fn(),
    } as any
  }

  it('listBases builds URL with offset when provided', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ bases: [], offset: undefined })

    const client = new AirtableMetadataClient(core)
    await client.listBases({ offset: 'abc' })

    expect(core.buildMetaUrl).toHaveBeenCalledTimes(1)
    const [path, search] = core.buildMetaUrl.mock.calls[0] as [
      string,
      URLSearchParams,
    ]
    expect(path).toBe('/bases')
    expect(search.get('offset')).toBe('abc')

    expect(core.requestJson).toHaveBeenCalledTimes(1)
    const [url, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toContain('/bases')
    expect(init.method).toBe('GET')
  })

  it('listAllBases paginates until no offset', async () => {
    const core = makeCore()
    core.requestJson
      .mockResolvedValueOnce({
        bases: [{ id: 'b1' }, { id: 'b2' }],
        offset: 'next',
      })
      .mockResolvedValueOnce({
        bases: [{ id: 'b3' }],
        offset: undefined,
      })

    const client = new AirtableMetadataClient(core)
    const all = await client.listAllBases()

    expect(core.requestJson).toHaveBeenCalledTimes(2)
    expect(all.map((b: any) => b.id)).toEqual(['b1', 'b2', 'b3'])
  })

  it('getBaseSchema uses core.baseId by default and throws if missing', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ tables: [] })

    const client = new AirtableMetadataClient(core)
    await client.getBaseSchema()

    expect(core.buildMetaUrl).toHaveBeenCalledTimes(1)
    const [path1] = core.buildMetaUrl.mock.calls[0] as [string, URLSearchParams?]
    expect(path1).toBe('/bases/appBase/tables')

    // Situation with no baseId
    const coreNoBase = {
      ...makeCore(),
      baseId: '',
    }
    const clientNoBase = new AirtableMetadataClient(coreNoBase as any)
    await expect(clientNoBase.getBaseSchema()).rejects.toThrow(
      'AirtableMetadataClient: baseId is required for getBaseSchema',
    )
  })

  it('getBaseSchema allows overriding baseId', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ tables: [] })

    const client = new AirtableMetadataClient(core)
    await client.getBaseSchema('otherBase')

    const [path] = core.buildMetaUrl.mock.calls[0] as [string]
    expect(path).toBe('/bases/otherBase/tables')
  })

  it('getTableSchema finds table by id or name and returns undefined when not found', async () => {
    const core = makeCore()
    const schema = {
      tables: [
        { id: 'tbl1', name: 'Table 1' },
        { id: 'tbl2', name: 'Projects' },
      ],
    }
    core.requestJson.mockResolvedValue(schema)

    const client = new AirtableMetadataClient(core)

    const byId = await client.getTableSchema('tbl1')
    expect(byId).toEqual({ id: 'tbl1', name: 'Table 1' })

    const byName = await client.getTableSchema('Projects')
    expect(byName).toEqual({ id: 'tbl2', name: 'Projects' })

    const missing = await client.getTableSchema('Missing')
    expect(missing).toBeUndefined()
  })

  it('getViewMetadata uses core.baseId by default and throws if missing', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ id: 'viw1', type: 'grid' })

    const client = new AirtableMetadataClient(core)
    await client.getViewMetadata('All tasks')

    expect(core.buildMetaUrl).toHaveBeenCalledTimes(1)
    const [path] = core.buildMetaUrl.mock.calls[0] as [string]
    expect(path).toBe('/bases/appBase/views/All%20tasks')

    // baseId missing
    const coreNoBase = {
      ...makeCore(),
      baseId: '',
    }
    const clientNoBase = new AirtableMetadataClient(coreNoBase as any)

    await expect(
      clientNoBase.getViewMetadata('Some view'),
    ).rejects.toThrow(
      'AirtableMetadataClient: baseId is required for getViewMetadata',
    )
  })

  it('getViewMetadata allows overriding baseId', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({ id: 'viw1', type: 'grid' })

    const client = new AirtableMetadataClient(core)
    await client.getViewMetadata('My view', 'baseXYZ')

    const [path] = core.buildMetaUrl.mock.calls[0] as [string]
    expect(path).toBe('/bases/baseXYZ/views/My%20view')
  })
})
