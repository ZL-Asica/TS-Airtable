# AirtableTable

Defined in: [types/airtable.ts:132](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L132)

Table wrapper returned by `base('TableName')`.

It exposes the most commonly used table-level helpers, mirroring the
airtable.js style API:

- `select().all()` / `select().firstPage()`
- `find`
- `create` / `update` / `updateRecord`
- `destroy` / `destroyMany`

Each method uses the generic type parameter `TFields` to type the `fields`
property on returned records.

## Type Parameters

### TFields

`TFields` = [`AirtableFieldSet`](AirtableFieldSet.md)

Shape of the `fields` object on each record in this table.

## Properties

### select

> **select**: (`params?`) => [`AirtableQuery`](AirtableQuery.md)\<`TFields`\>

Defined in: [types/airtable.ts:156](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L156)

Start a query against this table.

This is the entry point for the `select().all()` / `select().firstPage()`
pattern. The returned [AirtableQuery](AirtableQuery.md) is immutable; calling `all()`
or `firstPage()` reuses the same query parameters.

#### Parameters

##### params?

`Omit`\<[`ListRecordsParams`](ListRecordsParams.md), `"offset"`\>

Query options for listing records. This is the same as
[ListRecordsParams](ListRecordsParams.md) but without the `offset` field, because offset
is managed internally by `.all()` / `.firstPage()`.

#### Returns

[`AirtableQuery`](AirtableQuery.md)\<`TFields`\>

An [AirtableQuery](AirtableQuery.md) that can be used to fetch records.

#### Example

```ts
const query = base('Tasks').select({
  view: 'Open tasks',
  maxRecords: 100,
})

const records = await query.all()
```

***

### find

> **find**: (`recordId`, `params?`) => `Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>\>

Defined in: [types/airtable.ts:179](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L179)

Retrieve a single record by ID.

This corresponds to the `table.find(recordId, params?)` pattern from
airtable.js and uses the underlying `getRecord` API.

If the record does not exist or Airtable returns a non-2xx status,
the promise rejects with an error.

#### Parameters

##### recordId

`string`

Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).

##### params?

[`GetRecordParams`](GetRecordParams.md)

Optional parameters controlling which fields to fetch,
  cell format, etc. See [GetRecordParams](GetRecordParams.md).

#### Returns

`Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>\>

A promise that resolves to the requested [AirtableRecord](AirtableRecord.md).

#### Example

```ts
const record = await base('Tasks').find('recXXXXXXXXXXXXXX')
console.log(record.fields.Name)
```

***

### create

> **create**: (`records`, `options?`) => `Promise`\<[`CreateRecordsResult`](CreateRecordsResult.md)\<`TFields`\>\>

Defined in: [types/airtable.ts:206](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L206)

Create one or more records in this table.

This corresponds to `table.create(records, options?)` and uses the
underlying `createRecords` API. The `records` array contains objects
describing the fields for each new record.

#### Parameters

##### records

[`CreateRecordInput`](CreateRecordInput.md)\<`TFields`\>[]

Array of records to create. Each item provides a `fields`
  object matching `TFields`. See [CreateRecordInput](CreateRecordInput.md).

##### options?

[`CreateRecordsOptions`](CreateRecordsOptions.md)

Optional creation options such as `typecast`. See
  [CreateRecordsOptions](CreateRecordsOptions.md).

#### Returns

`Promise`\<[`CreateRecordsResult`](CreateRecordsResult.md)\<`TFields`\>\>

A promise that resolves to the creation result containing the
  newly created records. See [CreateRecordsResult](CreateRecordsResult.md).

#### Example

```ts
const result = await base('Tasks').create([
  { fields: { Name: 'Buy milk', Done: false } },
  { fields: { Name: 'Write docs', Done: false } },
])

console.log(result.records[0].id)
```

***

### update

> **update**: \{(`records`, `options?`): `Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>; (`records`, `options`): `Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>; \}

Defined in: [types/airtable.ts:235](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L235)

Batch update or upsert records in this table.

This corresponds to `table.update(records, options?)` and uses the
underlying `updateRecords` API. Regular updates require each record to
contain an `id`; upserts may omit `id` when `performUpsert` is provided.

Depending on [UpdateRecordsOptions.performUpsert](UpdateRecordsOptions.md#performupsert), this may perform
pure updates (by ID) or upserts based on external IDs.

#### Call Signature

> (`records`, `options?`): `Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>

##### Parameters

###### records

[`UpdateRecordInput`](UpdateRecordInput.md)\<`TFields`\>[]

###### options?

`Omit`\<[`UpdateRecordsOptions`](UpdateRecordsOptions.md), `"performUpsert"`\>

##### Returns

`Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>

#### Call Signature

> (`records`, `options`): `Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>

##### Parameters

###### records

[`UpsertRecordInput`](UpsertRecordInput.md)\<`TFields`\>[]

###### options

[`UpdateRecordsOptions`](UpdateRecordsOptions.md) & `object`

##### Returns

`Promise`\<[`UpdateRecordsResult`](UpdateRecordsResult.md)\<`TFields`\>\>

#### Param

Array of update inputs. See [UpdateRecordInput](UpdateRecordInput.md).

#### Param

Optional update/upsert options. See
  [UpdateRecordsOptions](UpdateRecordsOptions.md).

#### Returns

A promise that resolves to the update result. See
  [UpdateRecordsResult](UpdateRecordsResult.md).

#### Example

```ts
const result = await base('Tasks').update([
  { id: 'recXXXXXXXXXXXXXX', fields: { Done: true } },
])
```

***

### updateRecord

> **updateRecord**: (`recordId`, `fields`, `options?`) => `Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>\>

Defined in: [types/airtable.ts:270](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L270)

Update a single record by ID.

This is a convenience wrapper around the batch [AirtableTable.update](#update)
method and corresponds to `table.update(recordId, fields, options?)` in
airtable.js.

#### Parameters

##### recordId

`string`

Airtable record ID to update.

##### fields

`Partial`\<`TFields`\>

Partial `TFields` object containing only the fields you
  want to change.

##### options?

`Omit`\<[`UpdateRecordsOptions`](UpdateRecordsOptions.md), `"performUpsert"`\>

Optional update options, excluding `performUpsert` since
  this helper is strictly ID-based. See [UpdateRecordsOptions](UpdateRecordsOptions.md).

#### Returns

`Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>\>

A promise that resolves to the updated [AirtableRecord](AirtableRecord.md).

#### Example

```ts
const updated = await base('Tasks').updateRecord('recXXXXXXXXXXXXXX', {
  Done: true,
})
```

***

### destroy

> **destroy**: (`recordId`) => `Promise`\<\{ `id`: `string`; `deleted`: `boolean`; \}\>

Defined in: [types/airtable.ts:293](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L293)

Delete a single record by ID.

This corresponds to `table.destroy(recordId)` in airtable.js and uses the
underlying delete-records API with a single ID.

#### Parameters

##### recordId

`string`

Airtable record ID to delete.

#### Returns

`Promise`\<\{ `id`: `string`; `deleted`: `boolean`; \}\>

A promise that resolves to a small result object containing the
  deleted record ID and a `deleted` flag.

#### Example

```ts
const res = await base('Tasks').destroy('recXXXXXXXXXXXXXX')
console.log(res.deleted) // true
```

***

### destroyMany

> **destroyMany**: (`recordIds`) => `Promise`\<[`DeleteRecordsResult`](DeleteRecordsResult.md)\>

Defined in: [types/airtable.ts:314](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/airtable.ts#L314)

Delete multiple records by ID.

This corresponds to `table.destroy(recordIds)` in airtable.js and uses the
underlying batch delete API.

#### Parameters

##### recordIds

`string`[]

Array of Airtable record IDs to delete.

#### Returns

`Promise`\<[`DeleteRecordsResult`](DeleteRecordsResult.md)\>

A promise that resolves to a [DeleteRecordsResult](DeleteRecordsResult.md) describing
  which records were deleted.

#### Example

```ts
const res = await base('Tasks').destroyMany([
  'recAAA...',
  'recBBB...',
])
```
