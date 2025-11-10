import { describe, expect, it } from 'vitest'
import { isPlainObject, stableStringify } from '@/utils'

describe('isPlainObject', () => {
  it('returns false for null and primitives', () => {
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(123)).toBe(false)
    expect(isPlainObject('foo')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
  })

  it('returns true for normal plain objects and null-prototype objects', () => {
    expect(isPlainObject({ a: 1 })).toBe(true)

    const obj = Object.create(null) as any
    obj.x = 1
    expect(isPlainObject(obj)).toBe(true)
  })

  it('returns false for arrays and non-plain instances', () => {
    expect(isPlainObject([1, 2, 3])).toBe(false)

    class Foo {}
    const foo = new Foo()
    expect(isPlainObject(foo)).toBe(false)

    const date = new Date()
    expect(isPlainObject(date)).toBe(false)
  })
})

describe('stableStringify - primitives', () => {
  it('serializes primitives like JSON.stringify (number, string, boolean, null)', () => {
    expect(stableStringify(42)).toBe('42')
    expect(stableStringify('foo')).toBe('"foo"')
    expect(stableStringify(true)).toBe('true')
    expect(stableStringify(null)).toBe('null')
  })

  it('returns empty string for top-level undefined (JSON.stringify(undefined) === undefined)', () => {
    expect(stableStringify(undefined as any)).toBe('')
  })

  it('returns empty string for top-level functions (also JSON.stringify(fn) === undefined)', () => {
    const fn = () => {}
    expect(stableStringify(fn as any)).toBe('')
  })
})

describe('stableStringify - plain objects & key ordering', () => {
  it('produces stable ordering for plain objects regardless of key order', () => {
    const a = { b: 1, a: 2 }
    const b = { a: 2, b: 1 }

    const sa = stableStringify(a)
    const sb = stableStringify(b)

    expect(sa).toBe('{"a":2,"b":1}')
    expect(sb).toBe('{"a":2,"b":1}')
    expect(sa).toBe(sb)
  })

  it('drops unsupported values inside objects (undefined, function, symbol)', () => {
    const obj: any = {
      keep1: 1,
      keep2: 'ok',
      dropUndef: undefined,
      dropFn: () => {},
      dropSym: Symbol('x'),
    }

    const s = stableStringify(obj)
    expect(s).toBe('{"keep1":1,"keep2":"ok"}')
  })

  it('treats null-prototype objects as plain objects and sorts their keys', () => {
    const obj = Object.create(null) as any
    obj.b = 1
    obj.a = 2

    const s = stableStringify(obj)
    expect(s).toBe('{"a":2,"b":1}')
  })
})

describe('stableStringify - arrays', () => {
  it('preserves array order and normalizes elements', () => {
    const arr: any[] = [
      1,
      undefined,
      () => {},
      Symbol('x'),
      { b: 2, a: 1 }, // plain object inside array → sorted keys
    ]

    const s = stableStringify(arr)
    // unsupported values inside arrays should become null
    expect(s).toBe('[1,null,null,null,{"a":1,"b":2}]')
  })

  it('handles nested objects and arrays correctly', () => {
    const value = {
      meta: { z: 3, a: 1 },
      ids: [3, 2, 1],
    }

    const s = stableStringify(value)
    expect(s).toBe('{"ids":[3,2,1],"meta":{"a":1,"z":3}}')
  })
})

describe('stableStringify - non-plain objects', () => {
  it('delegates non-plain objects (e.g. Date) to JSON.stringify', () => {
    const date = new Date('2020-01-01T00:00:00.000Z')
    const s = stableStringify(date as any)

    // For Date, JSON.stringify(date) returns an ISO string in quotes
    expect(s).toBe(JSON.stringify(date))
  })
})

describe('stableStringify - circular structures', () => {
  it('throws TypeError for circular plain objects', () => {
    const obj: any = { a: 1 }
    obj.self = obj

    expect(() => stableStringify(obj)).toThrowError(TypeError)
    expect(() => stableStringify(obj)).toThrowError(
      /Converting circular structure to JSON in stableStringify/,
    )
  })

  it('throws TypeError for circular arrays', () => {
    const arr: any[] = [1]
    arr.push(arr)

    expect(() => stableStringify(arr)).toThrowError(TypeError)
    expect(() => stableStringify(arr)).toThrowError(
      /Converting circular structure to JSON in stableStringify/,
    )
  })
})
