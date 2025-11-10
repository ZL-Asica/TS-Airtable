import type { ListRecordsParams } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// We mock the high-level AirtableClient so that we can:
// - assert constructor options
// - inject a fake `records` implementation
const AirtableClientMock = vi.fn()

vi.mock('@/client', () => ({
  AirtableClient: AirtableClientMock,
}))

describe('airtable global facade', () => {
  beforeEach(() => {
    AirtableClientMock.mockReset()
    // Reset module cache so each test sees a fresh globalConfig.
    vi.resetModules()
  })

  it('throws if base is called with an empty baseId', async () => {
    const { Airtable } = await import('@/airtable')

    expect(() => Airtable.base('')).toThrowError(
      'Airtable.base: baseId is required',
    )
    expect(AirtableClientMock).not.toHaveBeenCalled()
  })

  it('throws if base is called before apiKey is configured', async () => {
    const { Airtable } = await import('@/airtable')

    expect(() => Airtable.base('app123')).toThrowError(
      'Airtable.base: apiKey must be configured via Airtable.configure(...)',
    )
    expect(AirtableClientMock).not.toHaveBeenCalled()
  })

  it('configure handles missing fields without overriding anything', async () => {
    const { Airtable } = await import('@/airtable')

    // For just going through all the false paths of `if (config.xxx)` branches
    Airtable.configure({} as any)

    // base still cannot be used properly (because no apiKey), but configure should not throw
    expect(typeof Airtable.base).toBe('function')
  })

  it('configure + base create AirtableClient with merged options', async () => {
    const fakeFetch = vi.fn() as unknown as typeof fetch
    const retryStatuses = [429, 500]

    // Use a "constructor style" implementation to ensure `new AirtableClientMock()` works
    AirtableClientMock.mockImplementation(function (this: any, opts: any) {
      // Attach _opts to the instance for assertions in tests
      ;(this as any)._opts = opts
      // Also provide an empty records to avoid errors on subsequent access
      ;(this as any).records = {}
    })

    const { Airtable } = await import('@/airtable')

    Airtable.configure({
      apiKey: 'testApiKey',
      endpointUrl: 'https://example.com',
      fetch: fakeFetch,
      maxRetries: 7,
      retryInitialDelayMs: 250,
      retryOnStatuses: retryStatuses,
    })

    const base = Airtable.base<{ name: string }>('appBase123')

    // Constructor should be called once
    expect(AirtableClientMock).toHaveBeenCalledTimes(1)

    // Get the first instance created by new AirtableClientMock()
    const instance = AirtableClientMock.mock.instances[0] as any
    expect(instance._opts).toEqual({
      apiKey: 'testApiKey',
      baseId: 'appBase123',
      endpointUrl: 'https://example.com',
      fetch: fakeFetch,
      maxRetries: 7,
      retryInitialDelayMs: 250,
      retryOnStatuses: retryStatuses,
    })

    // base.id / base.client metadata should be correct
    expect(base.id).toBe('appBase123')
    expect(base.client).toBe(instance)
  })

  it('base(table) helpers delegate to records client methods', async () => {
    // Prepare a set of records mocks
    const listAllRecords = vi.fn().mockResolvedValue([
      { id: 'recAll', fields: { name: 'all' } },
    ])
    const listRecords = vi.fn().mockResolvedValue({
      records: [{ id: 'recPage', fields: { name: 'page' } }],
    })
    const getRecord = vi.fn().mockResolvedValue({
      id: 'rec1',
      fields: { name: 'single' },
    })
    const createRecords = vi.fn().mockResolvedValue({
      records: [{ id: 'recCreated', fields: { name: 'created' } }],
    })
    const updateRecords = vi.fn().mockResolvedValue({
      records: [{ id: 'recUpdated', fields: { name: 'updated' } }],
    })
    const updateRecord = vi.fn().mockResolvedValue({
      id: 'recUpdatedOne',
      fields: { name: 'updated-one' },
    })
    const deleteRecord = vi.fn().mockResolvedValue({
      id: 'recDeleted',
      deleted: true,
    })
    const deleteRecords = vi.fn().mockResolvedValue({
      records: [{ id: 'recDeletedMany', deleted: true }],
    })

    AirtableClientMock.mockImplementation(function (this: any) {
      ;(this as any).records = {
        listAllRecords,
        listRecords,
        getRecord,
        createRecords,
        updateRecords,
        updateRecord,
        deleteRecord,
        deleteRecords,
      }
    })

    const { Airtable } = await import('@/airtable')

    // Only configure apiKey, so other branches of configure go through false paths
    Airtable.configure({
      apiKey: 'testApiKey',
    } as any)

    const base = Airtable.base<{ name: string }>('appBase123')
    const table = base('Tasks')

    // --- select().all() -> listAllRecords ---
    const allResult = await table
      .select({ view: 'Grid view', maxRecords: 10 })
      .all()

    expect(listAllRecords).toHaveBeenCalledTimes(1)
    expect(listAllRecords).toHaveBeenCalledWith('Tasks', {
      view: 'Grid view',
      maxRecords: 10,
    })
    expect(allResult).toEqual([{ id: 'recAll', fields: { name: 'all' } }])

    // --- select().firstPage() -> listRecords + unwrap .records ---
    const firstPageResult = await table
      .select({ pageSize: 5 })
      .firstPage()

    expect(listRecords).toHaveBeenCalledTimes(1)
    expect(listRecords).toHaveBeenCalledWith('Tasks', {
      pageSize: 5,
    } as ListRecordsParams)
    expect(firstPageResult).toEqual([
      { id: 'recPage', fields: { name: 'page' } },
    ])

    // --- find() -> getRecord ---
    const found = await table.find('rec1', { userLocale: 'en' })
    expect(getRecord).toHaveBeenCalledWith('Tasks', 'rec1', {
      userLocale: 'en',
    })
    expect(found).toEqual({
      id: 'rec1',
      fields: { name: 'single' },
    })

    // --- create() -> createRecords ---
    const created = await table.create(
      [{ fields: { name: 'created' } }],
      { typecast: true },
    )
    expect(createRecords).toHaveBeenCalledWith(
      'Tasks',
      [{ fields: { name: 'created' } }],
      { typecast: true },
    )
    expect(created.records[0].id).toBe('recCreated')

    // --- update() -> updateRecords ---
    const updated = await table.update(
      [{ id: 'recUpdated', fields: { name: 'updated' } }],
      { typecast: false },
    )
    expect(updateRecords).toHaveBeenCalledWith(
      'Tasks',
      [{ id: 'recUpdated', fields: { name: 'updated' } }],
      { typecast: false },
    )
    expect(updated.records[0].id).toBe('recUpdated')

    // --- updateRecord() -> updateRecord ---
    const updatedOne = await table.updateRecord(
      'recUpdatedOne',
      { name: 'single-update' },
      { typecast: true },
    )
    expect(updateRecord).toHaveBeenCalledWith(
      'Tasks',
      'recUpdatedOne',
      { name: 'single-update' },
      { typecast: true },
    )
    expect(updatedOne.id).toBe('recUpdatedOne')

    // --- destroy() -> deleteRecord ---
    const deleted = await table.destroy('recDeleted')
    expect(deleteRecord).toHaveBeenCalledWith('Tasks', 'recDeleted')
    expect(deleted).toEqual({ id: 'recDeleted', deleted: true })

    // --- destroyMany() -> deleteRecords ---
    const deletedMany = await table.destroyMany(['recDeletedMany'])
    expect(deleteRecords).toHaveBeenCalledWith('Tasks', ['recDeletedMany'])
    expect(deletedMany.records[0].id).toBe('recDeletedMany')
  })
})
