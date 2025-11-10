/**
 * Runtime check for "plain" objects.
 */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (val === null || typeof val !== 'object') {
    return false
  }
  const proto = Object.getPrototypeOf(val)
  return proto === Object.prototype || proto === null
}

/**
 * Deterministically serializes a value to JSON with **stable key ordering**.
 *
 * This is similar to {@link JSON.stringify}, but with one important difference:
 * for plain objects (objects with `Object.prototype` or a `null` prototype),
 * all keys are sorted lexicographically at every level before serialization.
 *
 * This makes the output string stable for semantically equivalent objects, e.g.:
 *
 * - `stableStringify({ a: 1, b: 2 })`
 * - `stableStringify({ b: 2, a: 1 })`
 *
 * will both produce exactly the same JSON string. This is very useful for:
 *
 * - Cache keys / memoization keys
 * - Request deduplication
 * - Logging / debugging where diffing strings is easier than diffing objects
 *
 * Behaviour notes (differences / similarities vs `JSON.stringify`):
 *
 * - **Plain objects**: keys are sorted with `Object.keys(o).sort()` and this
 *   is applied recursively.
 * - **Arrays**: preserved in their original order; elements are normalized
 *   recursively.
 * - **Non-plain objects** (e.g. `Date`, class instances, `Map`, etc.):
 *   we do *not* attempt to sort their internal structure; they are passed
 *   through and left to `JSON.stringify` to handle (including `toJSON`).
 * - **Unsupported values inside objects** (`undefined`, `function`, `symbol`):
 *   dropped from objects, matching `JSON.stringify`.
 * - **Unsupported values inside arrays** (`undefined`, `function`, `symbol`):
 *   converted to `null`, matching `JSON.stringify`.
 * - **Top-level values that `JSON.stringify` would return `undefined` for**
 *   (e.g. a top-level function or `undefined`) will result in an empty string
 *   `""`. In practice, you should avoid passing such values.
 * - **Circular structures**: not supported. A `TypeError` is thrown with a
 *   message similar to `JSON.stringify` when a circular reference is detected.
 *
 * @typeParam T - The type of the value being serialized.
 *
 * @param value - Any JSON-serializable value you want to stringify
 *   with stable key ordering.
 *
 * @returns A JSON string with deterministic object key ordering. For "normal"
 *   JSON-serializable inputs (objects, arrays, primitives), this will never
 *   be empty.
 *
 * @example
 * // Basic usage: stable object keys
 * stableStringify({ b: 1, a: 2 });
 * // => '{"a":1,"b":1}'
 *
 * @example
 * // Nested objects and arrays
 * stableStringify({
 *   meta: { z: 3, a: 1 },
 *   ids: [3, 2, 1],
 * });
 * // => '{"ids":[3,2,1],"meta":{"a":1,"z":3}}'
 *
 * @example
 * // Using as part of a cache key for list queries
 * const key = `records:list:${baseId}:${encodeURIComponent(table)}:${stableStringify(params ?? {})}`;
 * cache.set(key, result);
 *
 * @example
 * // Using as part of a cache key for get-by-id queries
 * const key = `records:get:${baseId}:${encodeURIComponent(table)}:${recordId}:${stableStringify(params ?? {})}`;
 * cache.set(key, record);
 */
export function stableStringify<T>(value: T): string {
  const seen = new WeakSet<object>()

  const normalize = (val: unknown): unknown => {
    // Primitives (including null) are returned as-is
    if (val === null || typeof val !== 'object') {
      return val
    }

    // For non-plain objects (Date, Map, Set, class instances, etc),
    // delegate to JSON.stringify behaviour by returning as-is.
    if (!isPlainObject(val) && !Array.isArray(val)) {
      return val
    }

    if (seen.has(val)) {
      // Match JSON.stringify semantics as closely as practical
      throw new TypeError('Converting circular structure to JSON in stableStringify')
    }
    seen.add(val)

    // Arrays: preserve order, normalize items
    if (Array.isArray(val)) {
      return val.map((item) => {
        if (
          item === undefined
          || typeof item === 'function'
          || typeof item === 'symbol'
        ) {
          // JSON.stringify turns these into null inside arrays
          return null
        }
        return normalize(item)
      })
    }

    // Plain objects: sort keys, drop unsupported values
    const keys = Object.keys(val).sort()
    const result: Record<string, unknown> = {}

    for (const key of keys) {
      const item = (val as Record<string, unknown>)[key]

      if (
        item === undefined
        || typeof item === 'function'
        || typeof item === 'symbol'
      ) {
        // JSON.stringify omits these from objects
        continue
      }

      result[key] = normalize(item)
    }

    return result
  }

  const normalized = normalize(value)
  const json = JSON.stringify(normalized)
  // JSON.stringify can return undefined for some odd top-level values;
  // make sure we always return a string.
  return json ?? ''
}
