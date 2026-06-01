# AirtableGlobalConfig

> **AirtableGlobalConfig** = `Omit`\<[`AirtableClientOptions`](../Interfaces/AirtableClientOptions.md), `"baseId"`\>

Defined in: [types/airtable.ts:53](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/airtable.ts#L53)

Global configuration for the top-level Airtable singleton.

This is essentially [AirtableClientOptions](../Interfaces/AirtableClientOptions.md) without `baseId`, because
the base ID is provided later via `Airtable.base(baseId)`.

Typical flow:

1. Call `Airtable.configure(config)` with an AirtableGlobalConfig.
2. Call `const base = Airtable.base('appXXXXXXXXXXXXXX')`.
3. Use `base('Table').select().all()` etc.

## Example

```ts
import Airtable from 'ts-airtable'

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  endpointUrl: 'https://api.airtable.com', // optional override
  fetch: customFetch,                      // optional
  recordsCache: {
    // optional global records cache
    defaultTtlMs: 30_000,
  },
})

const base = Airtable.base<{ Name: string }>('appXXXXXXXXXXXXXX')
const records = await base('Contacts').select({ maxRecords: 50 }).all()
```
