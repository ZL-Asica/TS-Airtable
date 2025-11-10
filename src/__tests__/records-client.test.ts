import type { DeleteRecordsResult } from '@/types'
import { describe, expect, it, vi } from 'vitest'
import { AirtableRecordsClient } from '@/client/records-client'

describe('airtableRecordsClient', () => {
  interface TaskFields {
    Name: string
    Status?: 'Todo' | 'Doing' | 'Done'
  }

  const makeCore = () => {
    return {
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
    expect(result.records).toEqual([]) // 因为 resp.records 没有
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
    // 确认确实走了两页，也就一定执行了 `offset = page.offset`
    expect(listSpy).toHaveBeenCalledTimes(2)
  })
})
