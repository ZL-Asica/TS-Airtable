---
title: Metadata API
description: Learn how to use the Metadata API in Airtable TS to access information about bases, tables, fields, and views.
---

# Metadata API

The **metadata API** exposes information about:

- bases you have access to
- tables, fields and views inside a base
- view metadata (like type and name)

All of this lives under `client.metadata`.

> The façade (`Airtable.base(...)`) is focused on records only.
> Use `AirtableClient` when you need metadata.

## Listing bases

```ts
const page = await client.metadata.listBases()

for (const base of page.bases) {
  console.log(base.id, base.name, base.permissionLevel)
}
```

`listBases` returns a single page and an optional `offset`.
To fetch **all** bases, use:

```ts
const bases = await client.metadata.listAllBases()

for (const base of bases) {
  console.log(base.id, base.name)
}
```

## Base schema

Use `getBaseSchema` to inspect tables, fields and views in a base.

```ts
const schema = await client.metadata.getBaseSchema()
// same as getBaseSchema(client.baseId)

for (const table of schema.tables) {
  console.log(table.id, table.name)
  console.log('Fields:', table.fields.map(f => f.name))
  console.log('Views:', table.views.map(v => v.name))
}
```

You can also pass a different base id (if your token can see it):

```ts
const schema = await client.metadata.getBaseSchema('appOtherBase')
```

## Table schema helper

Instead of searching manually, you can use `getTableSchema`:

```ts
const tasksTable = await client.metadata.getTableSchema('Tasks')
// or by table id: 'tblXXXXXXXXXXXXXX'

if (!tasksTable) {
  throw new Error('Table not found')
}

console.log(tasksTable.name)
console.log(tasksTable.fields.map(f => `${f.name} (${f.type})`))
```

This simply calls `getBaseSchema` internally and finds the matching table by:

- `table.id === tableIdOrName`, or
- `table.name === tableIdOrName`

## View metadata

Use `getViewMetadata` to inspect a single view:

```ts
const view = await client.metadata.getViewMetadata('Grid view')
// or by id: 'viwXXXXXXXXXXXXXX'

console.log(view.id)
console.log(view.name)
console.log(view.type) // e.g. 'grid'
```

You can also pass an explicit base:

```ts
const view = await client.metadata.getViewMetadata('All tasks', 'appOtherBase')
```

## Typical workflows

Some common things you might do with metadata:

- **Generate types** from schema (e.g. a script that inspects fields and outputs TS types)
- **Validate configuration**, like “does this base have a `Tasks` table?”
- **Dynamic UI building**, e.g. show available views / fields in a configuration page
