import type { DeleteRecordsResult } from '@/types'
import { describe, expect, it, vi } from 'vitest'
import { AirtableRecordsClient } from '@/client/records-client'
import { listKey, recordKey, recordPrefix, tablePrefix } from '@/utils'

describe('airtableRecordsClient', () => {
  interface TaskFields {
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
      createdRecords: [{ id: 'recCreated', fields: { Name: 'New' } }],
      updatedRecords: [{ id: 'recUpdated', fields: { Name: 'Old' } }],
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
    expect(result.createdRecords?.[0].id).toBe('recCreated')
    expect(result.updatedRecords?.[0].id).toBe('recUpdated')
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
})
