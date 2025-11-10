import type { CellFormat } from '@/types'
import { describe, expect, it } from 'vitest'
import { listKey, recordKey, recordPrefix, tablePrefix } from '@/utils'

describe('tablePrefix', () => {
  it('builds a prefix with baseId and table name', () => {
    const result = tablePrefix('app123', 'Tasks')
    expect(result).toBe('records:list:app123:Tasks:')
  })

  it('uRL-encodes the table name', () => {
    const result = tablePrefix('app123', 'My Table/中文')
    // encodeURIComponent('My Table/中文') === 'My%20Table%2F%E4%B8%AD%E6%96%87'
    expect(result).toBe(
      'records:list:app123:My%20Table%2F%E4%B8%AD%E6%96%87:',
    )
  })
})

describe('recordPrefix', () => {
  it('builds a prefix with baseId, table and recordId', () => {
    const result = recordPrefix('app123', 'Tasks', 'rec456')
    expect(result).toBe('records:get:app123:Tasks:rec456:')
  })

  it('uRL-encodes the table name but not the recordId', () => {
    const result = recordPrefix('app123', 'My Table', 'rec/with/slash')
    expect(result).toBe(
      'records:get:app123:My%20Table:rec/with/slash:',
    )
  })
})

describe('listKey', () => {
  it('uses an empty params object when params is undefined', () => {
    const result = listKey('app123', 'Tasks')
    // stableStringify({}) === '{}' for an empty object
    expect(result).toBe('records:list:app123:Tasks:{}')
  })

  it('includes a stable JSON representation of params', () => {
    const params1 = {
      maxRecords: 10,
      view: 'Grid view',
    }

    const params2 = {
      view: 'Grid view',
      maxRecords: 10,
    }

    const key1 = listKey('app123', 'Tasks', params1 as any)
    const key2 = listKey('app123', 'Tasks', params2 as any)

    // same semantics, different property order → same key
    expect(key1).toBe(key2)

    // The prefix should also be tablePrefix
    expect(key1.startsWith(tablePrefix('app123', 'Tasks'))).toBe(true)
  })
})

describe('recordKey', () => {
  it('uses an empty params object when params is undefined', () => {
    const key = recordKey('app123', 'Tasks', 'rec456')
    const prefix = recordPrefix('app123', 'Tasks', 'rec456')

    // prefix + '{}' (from stableStringify({}))
    expect(key).toBe(`${prefix}{}`)
  })

  it('includes a stable JSON representation of params', () => {
    const params1 = {
      fields: ['Name', 'Status'],
      cellFormat: 'json' as CellFormat,
    }

    const params2 = {
      cellFormat: 'json' as CellFormat,
      fields: ['Name', 'Status'],
    }

    const key1 = recordKey('app123', 'Tasks', 'rec456', params1)
    const key2 = recordKey('app123', 'Tasks', 'rec456', params2)

    // Same semantics, different property order → same key
    expect(key1).toBe(key2)

    const prefix = recordPrefix('app123', 'Tasks', 'rec456')
    expect(key1.startsWith(prefix)).toBe(true)

    // Simple sanity check: the suffix should be a JSON object
    const jsonPart = key1.slice(prefix.length)
    const parsed = JSON.parse(jsonPart)
    expect(parsed).toEqual({
      fields: ['Name', 'Status'],
      cellFormat: 'json',
    })
  })
})
