# AirtableErrorResponseBody

Defined in: [types/errors.ts:17](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/errors.ts#L17)

Raw error payload returned by Airtable API when a request fails.

This is a loose representation of the JSON error body. It is intentionally
permissive so the client does not break when Airtable introduces new fields.

## Example

```jsonc
{
  "error": {
    "type": "INVALID_REQUEST_UNKNOWN",
    "message": "The requested resource could not be found"
  }
}
```

## Indexable

> \[`key`: `string`\]: `unknown`

Any additional fields returned by the API that are not yet modeled.
This keeps the type forward-compatible with future API changes.

## Properties

### error?

> `optional` **error?**: `string` \| \{\[`key`: `string`\]: `unknown`; `type?`: `string`; `message?`: `string`; \}

Defined in: [types/errors.ts:24](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/errors.ts#L24)

Error details, either as a string or an object with `type` and `message`.

When present as an object, `type` is a short error code and `message`
is a human-readable description.

#### Union Members

`string`

***

##### Type Literal

\{\[`key`: `string`\]: `unknown`; `type?`: `string`; `message?`: `string`; \}

##### Index Signature

\[`key`: `string`\]: `unknown`

Additional error-specific fields that Airtable might include.

##### type?

> `optional` **type?**: `string`

Short machine-friendly error type identifier.
For example: `"INVALID_REQUEST_UNKNOWN"`, `"AUTHENTICATION_REQUIRED"`.

##### message?

> `optional` **message?**: `string`

Human-readable error message.
