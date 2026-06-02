# AirtableError

Defined in: [errors.ts:20](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/errors.ts#L20)

Error type thrown by [AirtableClient](AirtableClient.md) for non-successful responses.

Wraps the HTTP status code, a machine-readable error type (when available),
and the original error payload returned by Airtable.

## Example

```ts
try {
  const records = await client.listRecords('Tasks')
} catch (err) {
  if (err instanceof AirtableError) {
    console.error('Request failed', err.status, err.type, err.message)
  }
}
```

## Extends

- `Error`

## Constructors

### Constructor

> **new AirtableError**(`status`, `payload?`): `AirtableError`

Defined in: [errors.ts:47](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/errors.ts#L47)

Create an AirtableError from a status code and optional payload.

If the payload contains a structured `error` object, the error message
is taken from `payload.error.message`. Otherwise a generic message with
the status code is used.

#### Parameters

##### status

`number`

HTTP status code returned by the API.

##### payload?

[`AirtableErrorResponseBody`](../Interfaces/AirtableErrorResponseBody.md)

Optional error payload decoded from the response body.

#### Returns

`AirtableError`

#### Overrides

`Error.constructor`

## Properties

### status

> `readonly` **status**: `number`

Defined in: [errors.ts:24](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/errors.ts#L24)

HTTP status code of the failed response (e.g. 400, 401, 404, 500).

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [errors.ts:30](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/errors.ts#L30)

Optional machine-readable error type, when provided by the API.
For example: `"INVALID_REQUEST_UNKNOWN"`, `"AUTHENTICATION_REQUIRED"`.

***

### payload?

> `readonly` `optional` **payload?**: [`AirtableErrorResponseBody`](../Interfaces/AirtableErrorResponseBody.md)

Defined in: [errors.ts:35](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/errors.ts#L35)

Raw error payload returned by Airtable, if any.
