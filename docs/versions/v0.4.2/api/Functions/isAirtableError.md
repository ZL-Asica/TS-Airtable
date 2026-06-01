# isAirtableError()

> **isAirtableError**(`err`): `err is AirtableError`

Defined in: [errors.ts:90](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/errors.ts#L90)

Type guard to detect [AirtableError](../Classes/AirtableError.md) instances.

Useful when catching errors from [AirtableClient](../Classes/AirtableClient.md) and you want to
distinguish network/API errors from other exceptions in your application.

## Parameters

### err

`unknown`

Arbitrary value that may or may not be an [AirtableError](../Classes/AirtableError.md).

## Returns

`err is AirtableError`

`true` if `err` is an instance of [AirtableError](../Classes/AirtableError.md), otherwise `false`.

## Example

```ts
try {
  await client.listRecords('Tasks')
} catch (error) {
  if (isAirtableError(error)) {
    console.error('Airtable error', error.status, error.type)
  } else {
    console.error('Unexpected error', error)
  }
}
```
