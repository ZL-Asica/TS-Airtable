# AirtableAttachment

Defined in: [types/field-values.ts:37](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L37)

Attachment object used by Airtable for fields of type `"attachment"`.

For image attachments, Airtable also provides pre-generated thumbnails
under the `thumbnails` property. Non-image attachments (e.g. PDFs) may
omit `thumbnails`.

This interface intentionally mirrors the shape used by the official
`airtable` package.

## Properties

### id

> **id**: `string`

Defined in: [types/field-values.ts:41](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L41)

Unique identifier of the attachment in Airtable.

***

### url

> **url**: `string`

Defined in: [types/field-values.ts:46](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L46)

Direct URL for downloading / viewing the attachment.

***

### filename

> **filename**: `string`

Defined in: [types/field-values.ts:51](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L51)

Original filename of the uploaded attachment.

***

### size

> **size**: `number`

Defined in: [types/field-values.ts:56](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L56)

File size in bytes.

***

### type

> **type**: `string`

Defined in: [types/field-values.ts:61](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L61)

MIME type of the attachment (e.g. `"image/png"`, `"application/pdf"`).

***

### thumbnails?

> `optional` **thumbnails?**: `object`

Defined in: [types/field-values.ts:70](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/field-values.ts#L70)

Optional set of thumbnail renditions for image attachments.

- `small` – smallest rendition (fastest to load)
- `large` – larger rendition suitable for previews
- `full` – usually matches the original image dimensions

#### small

> **small**: [`AirtableThumbnail`](AirtableThumbnail.md)

#### large

> **large**: [`AirtableThumbnail`](AirtableThumbnail.md)

#### full

> **full**: [`AirtableThumbnail`](AirtableThumbnail.md)
