# PerformUpsertOptions

Defined in: [types/records.ts:307](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L307)

Upsert configuration used with `performUpsert`.

This tells Airtable which fields should be considered as "external keys"
for detecting existing records to be updated instead of created.

## Properties

### fieldsToMergeOn

> **fieldsToMergeOn**: `string`[]

Defined in: [types/records.ts:314](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L314)

Field names or field IDs to use as external keys.

Must contain between 1 and 3 entries (see Airtable docs).
Values are matched exactly when determining whether to update or create.
