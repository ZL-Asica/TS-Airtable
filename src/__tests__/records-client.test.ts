import type {
  AirtableFieldSet,
  CreateRecordInput,
  DeleteRecordsResult,
  UpsertRecordInput,
} from '@/types'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { MAX_LIST_RECORDS_GET_URL_LENGTH } from '@/client/core'
import { AirtableRecordsClient } from '@/client/records-client'
import { listKey, recordKey, recordPrefix, tablePrefix } from '@/utils'

describe('airtableRecordsClient', () => {
  interface TaskFields extends AirtableFieldSet {
    Name: string
    Status?: 'Todo' | 'Doing' | 'Done'
  }

  const makeCore = () => {
    return {
      baseId: 'appTest',
      buildTableUrl: vi.fn(() => new URL('https://example.com/table')),
      buildListQuery: vi.fn((params?: any) =>
        params ? new URLSearchParams({ q: '1' }) : undefined,
      ),
      buildGetQuery: vi.fn((params?: any) =>
        params ? new URLSearchParams({ g: '1' }) : undefined,
      ),
      buildReturnFieldsQuery: vi.fn((flag?: boolean) =>
        flag === undefined
          ? undefined
          : new URLSearchParams({
              returnFieldsByFieldId: String(flag),
            }),
      ),
      requestJson: vi.fn(),
    } as any
  }

  // ---------------------------------------------------------------------------
  // Basic test (without cache)
  // ---------------------------------------------------------------------------

  it('listRecords delegates to core with built URL and query', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      offset: undefined,
    })

    const client = new AirtableRecordsClient<TaskFields>(core)
    const result = await client.listRecords('Tasks', {
      maxRecords: 10,
      view: 'Grid view',
    })

    expect(core.buildListQuery).toHaveBeenCalledWith({
      maxRecords: 10,
      view: 'Grid view',
    })
    expect(core.buildTableUrl).toHaveBeenCalledWith(
      'Tasks',
      undefined,
      expect.any(URLSearchParams),
    )
    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    )

    expect(result.records).toHaveLength(1)
    expect(result.records[0].id).toBe('rec1')
    expect(result.records[0].fields.Name).toBe('Task 1')
  })

  it('listRecords uses POST /listRecords when the GET URL exceeds Airtable limits', async () => {
    const core = makeCore()
    core.buildTableUrl.mockImplementation((
      tableIdOrName: string,
      recordId?: string,
      query?: URLSearchParams,
    ) => {
      const suffix = recordId ? `/${recordId}` : ''
      const url = new URL(`https://example.com/${tableIdOrName}${suffix}`)
      if (query && Array.from(query.keys()).length > 0) {
        url.search = query.toString()
      }
      return url
    })
    core.buildListQuery.mockImplementation((params?: any) => {
      if (!params) {
        return undefined
      }

      const search = new URLSearchParams()
      if (params.filterByFormula) {
        search.set('filterByFormula', params.filterByFormula)
      }
      if (params.maxRecords != null) {
        search.set('maxRecords', String(params.maxRecords))
      }
      if (params.pageSize != null) {
        search.set('pageSize', String(params.pageSize))
      }
      if (params.offset) {
        search.set('offset', params.offset)
      }
      if (params.view) {
        search.set('view', params.view)
      }
      if (params.cellFormat) {
        search.set('cellFormat', params.cellFormat)
      }
      if (params.timeZone) {
        search.set('timeZone', params.timeZone)
      }
      if (params.userLocale) {
        search.set('userLocale', params.userLocale)
      }
      if (params.returnFieldsByFieldId !== undefined) {
        search.set('returnFieldsByFieldId', String(params.returnFieldsByFieldId))
      }
      if (params.fields) {
        for (const field of params.fields) {
          search.append('fields[]', field)
        }
      }
      if (params.sort) {
        params.sort.forEach((spec: any, index: number) => {
          search.append(`sort[${index}][field]`, spec.field)
          if (spec.direction) {
            search.append(`sort[${index}][direction]`, spec.direction)
          }
        })
      }
      return search
    })

    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
    })

    const client = new AirtableRecordsClient<TaskFields>(core, { store })
    const params = {
      filterByFormula: `FIND("${'x'.repeat(16_500)}", {Notes})`,
      maxRecords: 250,
      pageSize: 50,
      offset: 'itrNext',
      view: 'Grid view',
      fields: ['Name', 'Status'],
      sort: [{ field: 'Name', direction: 'asc' as const }],
      cellFormat: 'string' as const,
      timeZone: 'UTC',
      userLocale: 'en',
      returnFieldsByFieldId: true,
    }

    await client.listRecords('Tasks', params)

    const [url, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/Tasks/listRecords')
    expect(url.searchParams.get('timeZone')).toBe('UTC')
    expect(url.searchParams.get('userLocale')).toBe('en')
    expect(init.method).toBe('POST')
    expect((init as { retryNetworkErrors?: boolean }).retryNetworkErrors).toBe(true)

    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body.filterByFormula).toBe(params.filterByFormula)
    expect(body.maxRecords).toBe(250)
    expect(body.pageSize).toBe(50)
    expect(body.offset).toBe('itrNext')
    expect(body.view).toBe('Grid view')
    expect(body.fields).toEqual(['Name', 'Status'])
    expect(body.sort).toEqual([{ field: 'Name', direction: 'asc' }])
    expect(body.cellFormat).toBe('string')
    expect(body.returnFieldsByFieldId).toBe(true)
    expect(body.timeZone).toBeUndefined()
    expect(body.userLocale).toBeUndefined()
    expect(store.set).toHaveBeenCalledWith(
      listKey(core.baseId, 'Tasks', params),
      expect.anything(),
      undefined,
    )
  })

  it('listRecords keeps GET when the generated URL is exactly at the Airtable limit', async () => {
    const core = makeCore()
    const prefix = 'https://example.com/'
    core.buildTableUrl.mockReturnValueOnce(
      new URL(`${prefix}${'x'.repeat(MAX_LIST_RECORDS_GET_URL_LENGTH - prefix.length)}`),
    )
    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
    })

    const client = new AirtableRecordsClient<TaskFields>(core)

    await client.listRecords('Tasks', { view: 'Grid view' })

    const [url, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toHaveLength(MAX_LIST_RECORDS_GET_URL_LENGTH)
    expect(init).toEqual({ method: 'GET' })
  })

  it('listRecords builds an empty POST /listRecords body when long URLs have no params', async () => {
    const core = makeCore()
    core.buildListQuery.mockReturnValue(undefined)
    core.buildTableUrl.mockImplementation((
      tableIdOrName: string,
      recordId?: string,
      query?: URLSearchParams,
    ) => {
      if (recordId === 'listRecords') {
        const url = new URL(`https://example.com/${tableIdOrName}/listRecords`)
        if (query && Array.from(query.keys()).length > 0) {
          url.search = query.toString()
        }
        return url
      }

      return new URL(`https://example.com/${'x'.repeat(MAX_LIST_RECORDS_GET_URL_LENGTH)}`)
    })
    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
    })

    const client = new AirtableRecordsClient<TaskFields>(core)

    await client.listRecords('Tasks')

    const [url, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/Tasks/listRecords')
    expect(url.search).toBe('')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({})
  })

  it('listAllRecords concatenates pages until offset is exhausted', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')

    listSpy
      .mockResolvedValueOnce({
        records: [
          { id: 'rec1', fields: { Name: 'Task 1' } },
          { id: 'rec2', fields: { Name: 'Task 2' } },
        ],
        offset: 'next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec3', fields: { Name: 'Task 3' } }],
        offset: undefined,
      })

    const all = await client.listAllRecords('Tasks', { view: 'Grid' })
    expect(listSpy).toHaveBeenCalledTimes(2)
    expect(all.map(r => r.id)).toEqual(['rec1', 'rec2', 'rec3'])
  })

  it('listAllRecords respects maxRecords and stops early', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')

    listSpy
      .mockResolvedValueOnce({
        records: [
          { id: 'rec1', fields: { Name: 'Task 1' } },
          { id: 'rec2', fields: { Name: 'Task 2' } },
        ],
        offset: 'next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec3', fields: { Name: 'Task 3' } }],
        offset: undefined,
      })

    const all = await client.listAllRecords('Tasks', {
      view: 'Grid',
      maxRecords: 2,
    })
    expect(all.map(r => r.id)).toEqual(['rec1', 'rec2'])
  })

  it('listAllRecords ignores caller-provided offsets and follows Airtable cursors', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')

    listSpy
      .mockResolvedValueOnce({
        records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
        offset: 'server-next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec2', fields: { Name: 'Task 2' } }],
        offset: undefined,
      })

    const all = await client.listAllRecords('Tasks', {
      view: 'Grid',
      offset: 'caller-offset',
    } as any)

    expect(all.map(r => r.id)).toEqual(['rec1', 'rec2'])
    expect(listSpy).toHaveBeenNthCalledWith(1, 'Tasks', {
      view: 'Grid',
      offset: undefined,
    })
    expect(listSpy).toHaveBeenNthCalledWith(2, 'Tasks', {
      view: 'Grid',
      offset: 'server-next',
    })
  })

  it('iterateRecords yields records across pages and honors maxRecords', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')
    listSpy
      .mockResolvedValueOnce({
        records: [
          { id: 'rec1', fields: { Name: 'Task 1' } },
          { id: 'rec2', fields: { Name: 'Task 2' } },
        ],
        offset: 'next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec3', fields: { Name: 'Task 3' } }],
        offset: undefined,
      })

    const collected: string[] = []
    for await (const rec of client.iterateRecords('Tasks', {
      maxRecords: 2,
    })) {
      collected.push(rec.id)
    }

    expect(collected).toEqual(['rec1', 'rec2'])
  })

  it('iterateRecords walks multiple pages when maxRecords is not set', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')

    listSpy
      .mockResolvedValueOnce({
        records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
        offset: 'next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec2', fields: { Name: 'Task 2' } }],
        offset: undefined,
      })

    const ids: string[] = []
    for await (const rec of client.iterateRecords('Tasks')) {
      ids.push(rec.id)
    }

    expect(ids).toEqual(['rec1', 'rec2'])
    // Confirm it actually went though 2 pages, which definitely executed `offset = page.offset`
    expect(listSpy).toHaveBeenCalledTimes(2)
  })

  it('iterateRecords ignores caller-provided offsets and follows Airtable cursors', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const listSpy = vi.spyOn(client, 'listRecords')

    listSpy
      .mockResolvedValueOnce({
        records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
        offset: 'server-next',
      })
      .mockResolvedValueOnce({
        records: [{ id: 'rec2', fields: { Name: 'Task 2' } }],
        offset: undefined,
      })

    const ids: string[] = []
    for await (const rec of client.iterateRecords('Tasks', {
      view: 'Grid',
      offset: 'caller-offset',
    } as any)) {
      ids.push(rec.id)
    }

    expect(ids).toEqual(['rec1', 'rec2'])
    expect(listSpy).toHaveBeenNthCalledWith(1, 'Tasks', {
      view: 'Grid',
      offset: undefined,
    })
    expect(listSpy).toHaveBeenNthCalledWith(2, 'Tasks', {
      view: 'Grid',
      offset: 'server-next',
    })
  })

  it('getRecord builds URL with recordId and get query', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'Task 1' },
    })

    const client = new AirtableRecordsClient<TaskFields>(core)
    const rec = await client.getRecord('Tasks', 'rec1', {
      userLocale: 'en',
    })

    expect(core.buildGetQuery).toHaveBeenCalledWith({ userLocale: 'en' })
    expect(core.buildTableUrl).toHaveBeenCalledWith(
      'Tasks',
      'rec1',
      expect.any(URLSearchParams),
    )
    expect(rec.id).toBe('rec1')
  })

  it('createRecords returns empty array when no records provided', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const result = await client.createRecords('Tasks', [])
    expect(result.records).toEqual([])
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('createRecords splits requests into batches and passes options', async () => {
    const core = makeCore()

    core.requestJson.mockImplementation(
      async (
        _url: URL,
        init: RequestInit,
      ): Promise<{ records: any[] }> => {
        const body = JSON.parse(init.body as string) as {
          records: Array<{ fields: TaskFields }>
          typecast?: boolean
        }
        return {
          records: body.records.map((r, idx) => ({
            id: `rec${idx + 1}`,
            fields: r.fields,
          })),
        }
      },
    )

    const client = new AirtableRecordsClient<TaskFields>(core)

    const records = Array.from({ length: 12 }, (_, i) => ({
      fields: { Name: `Task ${i + 1}` },
    }))

    const result = await client.createRecords('Tasks', records, {
      typecast: true,
      returnFieldsByFieldId: true,
    })

    expect(core.buildReturnFieldsQuery).toHaveBeenCalledWith(true)
    // 12 => run 2 batches
    expect(core.requestJson).toHaveBeenCalledTimes(2)
    expect(result.records).toHaveLength(12)
  })

  it('updateRecords returns empty when no records', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const result = await client.updateRecords('Tasks', [])
    expect(result.records).toEqual([])
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('updateRecords merges records from batches and does not set upsert arrays when empty', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      records: [
        { id: 'rec1', fields: { Name: 'A' } },
        { id: 'rec2', fields: { Name: 'B' } },
      ],
    })

    const client = new AirtableRecordsClient<TaskFields>(core)
    const result = await client.updateRecords(
      'Tasks',
      [
        { id: 'rec1', fields: { Name: 'A' } },
        { id: 'rec2', fields: { Name: 'B' } },
      ],
      { typecast: false },
    )

    expect(result.records.map(r => r.id)).toEqual(['rec1', 'rec2'])
    expect(result.createdRecords).toBeUndefined()
    expect(result.updatedRecords).toBeUndefined()
  })

  it('updateRecords collects createdRecords and updatedRecords when performUpsert is used', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      // No records fields, test resp.records falsy branch
      createdRecords: ['recCreated'],
      updatedRecords: ['recUpdated'],
    })

    const client = new AirtableRecordsClient<TaskFields>(core)
    const result = await client.updateRecords(
      'Tasks',
      [{ id: 'recX', fields: { Name: 'X' } }],
      {
        typecast: true,
        performUpsert: { fieldsToMergeOn: ['Name'] },
        returnFieldsByFieldId: false,
      },
    )

    expect(core.buildReturnFieldsQuery).toHaveBeenCalledWith(false)
    expect(result.records).toEqual([]) // Because resp.records is not present
    expect(result.createdRecords?.[0]).toBe('recCreated')
    expect(result.updatedRecords?.[0]).toBe('recUpdated')
  })

  it('updateRecords accepts upsert inputs without ids and invalidates response ids', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      records: [{ id: 'recUpdated', fields: { Name: 'Existing' } }],
      createdRecords: ['recCreated'],
      updatedRecords: ['recUpdated'],
    })

    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn().mockResolvedValue(undefined),
    }

    const client = new AirtableRecordsClient<TaskFields>(core, { store })
    const result = await client.updateRecords(
      'Tasks',
      [{ fields: { Name: 'External task' } }],
      { performUpsert: { fieldsToMergeOn: ['Name'] } },
    )

    expect(result.createdRecords).toEqual(['recCreated'])
    expect(result.updatedRecords).toEqual(['recUpdated'])

    const [, init] = core.requestJson.mock.calls[0] as [URL, RequestInit]
    const body = JSON.parse(init.body as string) as {
      records: Array<{ id?: string, fields: TaskFields }>
    }
    expect(body.records[0].id).toBeUndefined()

    const prefixes = store.deleteByPrefix.mock.calls.map(args => args[0])
    expect(prefixes).toContain(recordPrefix(core.baseId, 'Tasks', 'recCreated'))
    expect(prefixes).toContain(recordPrefix(core.baseId, 'Tasks', 'recUpdated'))
    expect(prefixes.some(prefix => String(prefix).includes('undefined'))).toBe(false)
  })

  it('updateRecords rejects records without ids when performUpsert is omitted', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    await expect(
      client.updateRecords(
        'Tasks',
        // @ts-expect-error id-less updates require performUpsert
        [{ fields: { Name: 'Missing id' } }],
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: record id is required unless performUpsert is provided',
    )
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('updateRecords validates performUpsert merge fields before sending a request', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: 'Missing merge field' } }],
        { performUpsert: { fieldsToMergeOn: [] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: performUpsert.fieldsToMergeOn must contain between 1 and 3 fields',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: 'Too many merge fields' } }],
        { performUpsert: { fieldsToMergeOn: ['A', 'B', 'C', 'D'] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: performUpsert.fieldsToMergeOn must contain between 1 and 3 fields',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Status: 'Todo' } }],
        { performUpsert: { fieldsToMergeOn: ['Name'] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: id-less upsert records must include non-null values for every field in performUpsert.fieldsToMergeOn',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: 'Blank merge config' } }],
        { performUpsert: { fieldsToMergeOn: [' '] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: performUpsert.fieldsToMergeOn entries must be non-empty strings',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: 'Invalid merge config' } }],
        { performUpsert: { fieldsToMergeOn: [null] as any } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: performUpsert.fieldsToMergeOn entries must be non-empty strings',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: 'Duplicate merge config' } }],
        { performUpsert: { fieldsToMergeOn: ['Name', 'Name'] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: performUpsert.fieldsToMergeOn must not contain duplicate fields',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: undefined } }],
        { performUpsert: { fieldsToMergeOn: ['Name'] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: id-less upsert records must include non-null values for every field in performUpsert.fieldsToMergeOn',
    )

    await expect(
      client.updateRecords(
        'Tasks',
        [{ fields: { Name: null as any } }],
        { performUpsert: { fieldsToMergeOn: ['Name'] } },
      ),
    ).rejects.toThrow(
      'AirtableRecordsClient.updateRecords: id-less upsert records must include non-null values for every field in performUpsert.fieldsToMergeOn',
    )

    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('supports partial create fields, id-less upsert inputs, and broad field values', () => {
    interface FlexibleFields extends AirtableFieldSet {
      Name: string
      Count?: number
    }

    const createInput: CreateRecordInput<FlexibleFields> = {
      fields: { Count: 1 },
    }
    const upsertInput: UpsertRecordInput<FlexibleFields> = {
      fields: {},
    }
    const fieldSet: AirtableFieldSet = {
      Empty: null,
      Barcode: { type: 'upc', text: '123456789' },
      Lookup: [1, 'two', null, { nested: true }],
    }

    expectTypeOf(createInput.fields).toMatchTypeOf<Partial<FlexibleFields>>()
    expectTypeOf(upsertInput.id).toEqualTypeOf<string | undefined>()
    expect(fieldSet.Empty).toBeNull()
  })

  it('updateRecord builds URL with recordId and body with fields and options', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'Updated' },
    })

    const client = new AirtableRecordsClient<TaskFields>(core)

    const rec = await client.updateRecord(
      'Tasks',
      'rec1',
      { Name: 'Updated' },
      { typecast: true, returnFieldsByFieldId: true },
    )

    expect(core.buildReturnFieldsQuery).toHaveBeenCalledWith(true)
    expect(core.buildTableUrl).toHaveBeenCalledWith(
      'Tasks',
      'rec1',
      expect.any(URLSearchParams),
    )
    expect(rec.id).toBe('rec1')
  })

  it('deleteRecord calls core with DELETE and returns result', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'rec1',
      deleted: true,
    })

    const client = new AirtableRecordsClient<TaskFields>(core)
    const res = await client.deleteRecord('Tasks', 'rec1')

    expect(core.buildTableUrl).toHaveBeenCalledWith('Tasks', 'rec1')
    expect(core.requestJson).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(res).toEqual({ id: 'rec1', deleted: true })
  })

  it('deleteRecords returns empty when no ids provided', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    const res = await client.deleteRecords('Tasks', [])
    expect(res.records).toEqual([])
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('deleteRecords splits ids into batches and aggregates responses', async () => {
    const core = makeCore()
    // Make requestJson return corresponding records to simulate batch delete
    core.requestJson.mockImplementation(
      async (_url: URL, _init: RequestInit): Promise<DeleteRecordsResult> => ({
        records: [
          { id: 'rec1', deleted: true },
          { id: 'rec2', deleted: true },
        ],
      }),
    )

    const client = new AirtableRecordsClient<TaskFields>(core)
    const ids = Array.from({ length: 12 }, (_, i) => `rec${i + 1}`)

    const res = await client.deleteRecords('Tasks', ids)

    // 12 => run 2 batches
    expect(core.requestJson).toHaveBeenCalledTimes(2)
    expect(res.records).toHaveLength(4) // Because each batch returns 2 mock records
  })

  // ---------------------------------------------------------------------------
  // Cache behavior + error handling tests
  // ---------------------------------------------------------------------------

  it('listRecords returns cached page when cache hit', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    const cachedPage = {
      records: [{ id: 'recCached', fields: { Name: 'Cached' } }],
      offset: undefined as string | undefined,
    }

    store.get.mockResolvedValue(cachedPage)

    const client = new AirtableRecordsClient<TaskFields>(core, { store })

    const params = { view: 'Grid view' as const }
    const result = await client.listRecords('Tasks', params)

    const expectedKey = listKey(core.baseId, 'Tasks', params)

    expect(store.get).toHaveBeenCalledWith(expectedKey)
    expect(core.requestJson).not.toHaveBeenCalled()
    expect(result).toBe(cachedPage)
  })

  it('listRecords populates cache on miss', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      offset: undefined,
    })

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      defaultTtlMs: 1234,
    })

    const params = { view: 'Grid view' as const }
    const result = await client.listRecords('Tasks', params)

    const expectedKey = listKey(core.baseId, 'Tasks', params)

    expect(store.get).toHaveBeenCalledWith(expectedKey)
    expect(store.set).toHaveBeenCalledWith(
      expectedKey,
      expect.objectContaining({
        records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      }),
      1234,
    )
    expect(core.requestJson).toHaveBeenCalledTimes(1)
    expect(result.records[0].id).toBe('rec1')
  })

  it('listRecords respects methods.listRecords = false (no caching)', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      offset: undefined,
    })

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      methods: { listRecords: false },
    })

    await client.listRecords('Tasks', { view: 'Grid' })

    expect(store.get).not.toHaveBeenCalled()
    expect(store.set).not.toHaveBeenCalled()
    expect(core.requestJson).toHaveBeenCalledTimes(1)
  })

  it('getRecord returns cached record when cache hit', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    const params = { userLocale: 'en' as const }
    const key = recordKey(core.baseId, 'Tasks', 'rec1', params)

    store.get.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'Cached' },
    })

    const client = new AirtableRecordsClient<TaskFields>(core, { store })
    const rec = await client.getRecord('Tasks', 'rec1', params)

    expect(store.get).toHaveBeenCalledWith(key)
    expect(core.requestJson).not.toHaveBeenCalled()
    expect(rec.id).toBe('rec1')
    expect(rec.fields.Name).toBe('Cached')
  })

  it('getRecord populates cache on miss', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'From API' },
    })

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      defaultTtlMs: 500,
    })

    const params = { userLocale: 'en' as const }
    const rec = await client.getRecord('Tasks', 'rec1', params)

    const expectedKey = recordKey(core.baseId, 'Tasks', 'rec1', params)

    expect(store.get).toHaveBeenCalledWith(expectedKey)
    expect(store.set).toHaveBeenCalledWith(
      expectedKey,
      expect.objectContaining({ id: 'rec1' }),
      500,
    )
    expect(core.requestJson).toHaveBeenCalledTimes(1)
    expect(rec.fields.Name).toBe('From API')
  })

  it('getRecord respects methods.getRecord = false (no caching)', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'API' },
    })

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      methods: { getRecord: false },
    })

    await client.getRecord('Tasks', 'rec1')

    expect(store.get).not.toHaveBeenCalled()
    expect(store.set).not.toHaveBeenCalled()
    expect(core.requestJson).toHaveBeenCalledTimes(1)
  })

  it('cache get errors are reported via onError but swallowed by default', async () => {
    const core = makeCore()
    const error = new Error('get failed')

    const store = {
      get: vi.fn().mockRejectedValue(error),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      offset: undefined,
    })

    const onError = vi.fn()
    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      onError,
      // failOnCacheError defaults to false
    })

    const params = { view: 'Grid' as const }
    const result = await client.listRecords('Tasks', params)

    expect(result.records[0].id).toBe('rec1')
    expect(core.requestJson).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalled()

    const calls = onError.mock.calls
    const key = listKey(core.baseId, 'Tasks', params)

    expect(
      calls.some(([_err, ctx]) => ctx.op === 'get' && ctx.key === key),
    ).toBe(true)
  })

  it('cache get errors are rethrown when failOnCacheError is true', async () => {
    const core = makeCore()
    const error = new Error('get failed')

    const store = {
      get: vi.fn().mockRejectedValue(error),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }

    const onError = vi.fn()
    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      onError,
      failOnCacheError: true,
    })

    await expect(
      client.listRecords('Tasks', { view: 'Grid' }),
    ).rejects.toBe(error)

    expect(onError).toHaveBeenCalled()
    expect(core.requestJson).not.toHaveBeenCalled()
  })

  it('cache set errors are swallowed by default', async () => {
    const core = makeCore()
    const error = new Error('set failed')

    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockRejectedValue(error),
      deleteByPrefix: vi.fn(),
    }

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
      offset: undefined,
    })

    const onError = vi.fn()
    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      onError,
    })

    const result = await client.listRecords('Tasks', { view: 'Grid' })

    expect(result.records[0].id).toBe('rec1')
    expect(core.requestJson).toHaveBeenCalledTimes(1)
    expect(store.set).toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()

    const calls = onError.mock.calls
    expect(
      calls.some(([_err, ctx]) => ctx.op === 'set' && ctx.key),
    ).toBe(true)
  })

  it('mutations invalidate table and record cache via deleteByPrefix', async () => {
    const core = makeCore()
    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: { Name: 'Updated' },
    })

    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn().mockResolvedValue(undefined),
    }

    const client = new AirtableRecordsClient<TaskFields>(core, { store })

    await client.updateRecord('Tasks', 'rec1', { Name: 'Updated' })

    const prefixes = store.deleteByPrefix.mock.calls.map(args => args[0])

    expect(prefixes).toContain(tablePrefix(core.baseId, 'Tasks'))
    expect(prefixes).toContain(recordPrefix(core.baseId, 'Tasks', 'rec1'))
  })

  it('cache delete errors are reported via onError but swallowed when failOnCacheError is false', async () => {
    const core = makeCore()
    const error = new Error('delete failed')

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', deleted: true }],
    })

    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn().mockRejectedValue(error),
    }

    const onError = vi.fn()
    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      onError,
      // failOnCacheError defaults to false
    })

    const res = await client.deleteRecords('Tasks', ['rec1'])

    expect(res.records[0]).toEqual({ id: 'rec1', deleted: true })
    expect(core.requestJson).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalled()

    const calls = onError.mock.calls
    expect(
      calls.some(([_err, ctx]) => ctx.op === 'delete' && ctx.prefix),
    ).toBe(true)
  })

  it('cache delete errors are rethrown when failOnCacheError is true', async () => {
    const core = makeCore()
    const error = new Error('delete failed')

    core.requestJson.mockResolvedValue({
      records: [{ id: 'rec1', fields: { Name: 'Task 1' } }],
    })

    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn().mockRejectedValue(error),
    }

    const onError = vi.fn()
    const client = new AirtableRecordsClient<TaskFields>(core, {
      store,
      onError,
      failOnCacheError: true,
    })

    await expect(
      client.createRecords('Tasks', [{ fields: { Name: 'Task 1' } }]),
    ).rejects.toBe(error)

    expect(onError).toHaveBeenCalled()
  })

  it('cache helpers are no-ops when no cache store is configured', async () => {
    const core = makeCore()
    const client = new AirtableRecordsClient<TaskFields>(core)

    await expect(
      // @ts-expect-error testing private helper
      client.cacheGet('cache-key'),
    ).resolves.toBeUndefined()
    await expect(
      // @ts-expect-error testing private helper
      client.cacheSet('cache-key', { ok: true }),
    ).resolves.toBeUndefined()
  })

  it('invalidateRecords is a no-op for empty record id lists', async () => {
    const core = makeCore()
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    }
    const client = new AirtableRecordsClient<TaskFields>(core, { store })

    await expect(
      // @ts-expect-error testing private helper
      client.invalidateRecords('Tasks', []),
    ).resolves.toBeUndefined()

    expect(store.deleteByPrefix).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Attachment transformation tests
  // ---------------------------------------------------------------------------

  it('getRecord applies cache.transformAttachment to attachment fields before caching and returning', async () => {
    const core = makeCore()

    core.requestJson.mockResolvedValue({
      id: 'rec1',
      fields: {
        Name: 'Task 1',
        Attachments: [
          {
            id: 'att1',
            url: 'https://airtable.com/temporary/att1',
            filename: 'a.png',
          },
        ],
      },
    })

    const transformAttachment = vi.fn(
      async (attachment: any, ctx: any) => ({
        ...attachment,
        url: `https://cdn.example.com/${attachment.id}`,
        transformed: true,
        ctxSnapshot: ctx,
      }),
    )

    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn(),
      transformAttachment,
    }

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store: store as any,
      defaultTtlMs: 1000,
    })

    const rec = await client.getRecord('Tasks', 'rec1')

    // transformer called exactly once, with correct attachment + context
    expect(transformAttachment).toHaveBeenCalledTimes(1)
    const [attachmentArg, ctxArg] = transformAttachment.mock.calls[0]

    expect(attachmentArg.id).toBe('att1')
    expect(attachmentArg.url).toBe('https://airtable.com/temporary/att1')

    expect(ctxArg).toEqual({
      baseId: core.baseId,
      tableIdOrName: 'Tasks',
      recordId: 'rec1',
      fieldName: 'Attachments',
    })

    // returned record sees the transformed attachment
    const fields: any = rec.fields
    expect(fields.Attachments[0].url).toBe('https://cdn.example.com/att1')
    expect(fields.Attachments[0].transformed).toBe(true)

    // value written to cache is also transformed, not the raw API response
    expect(store.set).toHaveBeenCalledTimes(1)
    const [, cachedValue] = store.set.mock.calls[0]

    const cachedFields: any = (cachedValue as any).fields
    expect(cachedFields.Attachments[0].url).toBe(
      'https://cdn.example.com/att1',
    )
    expect(cachedFields.Attachments[0].transformed).toBe(true)
  })

  it('listRecords applies cache.transformAttachment for all attachment arrays and skips non-attachment arrays', async () => {
    const core = makeCore()

    core.requestJson.mockResolvedValue({
      records: [
        {
          id: 'rec1',
          fields: {
            Name: 'Task 1',
            Attachments: [
              {
                id: 'att1',
                url: 'https://airtable.com/tmp/att1',
                filename: 'a.png',
              },
              {
                id: 'att2',
                url: 'https://airtable.com/tmp/att2',
                filename: 'b.png',
              },
            ],
          },
        },
        {
          id: 'rec2',
          fields: {
            Name: 'Task 2',
            Attachments: [
              {
                id: 'att3',
                url: 'https://airtable.com/tmp/att3',
                filename: 'c.png',
              },
            ],
            // This is an array but not an attachment array and should be ignored
            Tags: ['alpha', 'beta'],
          },
        },
      ],
      offset: undefined,
    })

    const transformAttachment = vi.fn(
      async (attachment: any, _ctx: any) => ({
        ...attachment,
        url: `https://cdn.example.com/${attachment.id}`,
      }),
    )

    const store = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn(),
      transformAttachment,
    }

    const client = new AirtableRecordsClient<TaskFields>(core, {
      store: store as any,
    })

    const page = await client.listRecords('Tasks')

    // 3 attachment objects total → transformer called 3 times
    expect(transformAttachment).toHaveBeenCalledTimes(3)

    // All attachments in the returned page should be rewritten
    const r1Fields: any = page.records[0].fields
    const r2Fields: any = page.records[1].fields

    expect(r1Fields.Attachments[0].url).toBe('https://cdn.example.com/att1')
    expect(r1Fields.Attachments[1].url).toBe('https://cdn.example.com/att2')
    expect(r2Fields.Attachments[0].url).toBe('https://cdn.example.com/att3')

    // Non-attachment arrays (e.g. Tags: string[]) are not passed to transformer
    const allFirstArgs = transformAttachment.mock.calls.map(
      ([att]) => (att as any).id,
    )
    expect(allFirstArgs).toEqual(['att1', 'att2', 'att3'])
    expect(r2Fields.Tags).toEqual(['alpha', 'beta'])

    // Cached value for listRecords should also contain transformed URLs
    expect(store.set).toHaveBeenCalledTimes(1)
    const [, cachedPage] = store.set.mock.calls[0]

    const cachedRecords: any[] = (cachedPage as any).records
    expect(cachedRecords[0].fields.Attachments[0].url).toBe(
      'https://cdn.example.com/att1',
    )
    expect(cachedRecords[1].fields.Attachments[0].url).toBe(
      'https://cdn.example.com/att3',
    )
  })
})
