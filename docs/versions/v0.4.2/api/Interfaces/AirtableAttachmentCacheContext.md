# AirtableAttachmentCacheContext

Defined in: [types/cache-store.ts:19](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L19)

Context passed to [AirtableCacheStore.transformAttachment](AirtableCacheStore.md#transformattachment) describing
where a given Airtable attachment was encountered.

This metadata is useful when you want to:

- Build stable object keys or folder structures in your own storage
  (e.g. `baseId/tableIdOrName/recordId/filename`).
- Apply different hosting or retention policies per table or per field
  (for example, store avatars and invoices in different buckets).
- Emit structured logs or metrics about how attachments are being used.

None of the fields in this context are meant to be secret; they mirror the
identifiers already visible in Airtable’s API. Implementations are free to
ignore any fields they do not need.

## Properties

### baseId

> **baseId**: `string`

Defined in: [types/cache-store.ts:28](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L28)

Airtable base identifier that the attachment belongs to.

This corresponds to the base ID used by the client (for example
`"appXXXXXXXXXXXXXX"`). It is stable for a given base and can be used
as the top-level namespace when organizing attachments in your own
storage layer.

***

### tableIdOrName

> **tableIdOrName**: `string`

Defined in: [types/cache-store.ts:39](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L39)

Table identifier or name in which the attachment was found.

This is the same value you passed as `tableIdOrName` to the records API
(e.g. `"Tasks"` or `"tblXXXXXXXXXXXXXX"`). You can use it to:

- Route attachments from different tables to different buckets.
- Build human-readable paths such as `baseId/tableName/recordId/...`.

***

### recordId?

> `optional` **recordId?**: `string`

Defined in: [types/cache-store.ts:52](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L52)

Optional Airtable record ID that owns this attachment.

When the attachment comes from a record-level context (e.g. list or
get operations), this will be set to the record’s ID
(for example `"recXXXXXXXXXXXXXX"`). It may be omitted in cases where
there is no single canonical record (or the SDK cannot determine it).

Use this to create per-record folders or to attach richer traceability
metadata in your logs or audit trail.

***

### fieldName?

> `optional` **fieldName?**: `string`

Defined in: [types/cache-store.ts:67](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L67)

Optional name of the field that contained this attachment.

This is the field key in the record’s `fields` object (for example
`"Attachments"`, `"Avatar"`, `"Invoice PDF"`). It may be `undefined`
if the SDK cannot reliably determine the originating field.

You can use this to:

- Apply different storage or retention policies per field.
- Construct paths like `base/table/fieldName/attachmentId`.
- Debug which logical column produced a given uploaded asset.
