# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-10

### Added

- Caching feature to records client. Corresponding documentations and test cases have been updated.
- Add new `docs:publish:ci` script in `package.json` for Vitepress auto deploy to Cloudflare Pages.

### Changes

- Adjust Vitepress sidebar logics. Only `api` route is auto generating now.
- Added `features` as a sub folder (route) to `guide` for advance features.

### Chore

- Update settings in `package.json` to improve robustness. Add type file in `.` import field. And move `husky` from `postinstall` to `prepare` to avoid affecting user's personal environment.
- Description updated.
- Rename `CODE_OF_CONDUCT.MD` to `CODE_OF_CONDUCT.md` by delete and added via 2 different commit to avoid case insensitive issue in git.

## [0.1.3] - 2025-11-09

### Fixed

- Fix npm link in vitepress setting to the right one.
- Rename `CODE_OF_CONDUCT.MD` to `CODE_OF_CONDUCT.md`.

## [0.1.2] - 2025-11-09

### Fixed

- `vue` setting in `eslint.config.mjs`. And turned on a11y for vue part.

## [0.1.1] - 2025-11-09

### Added

- `release.yml` GitHub Actions workflow to publish to npm automatically on tag push.
- `pre-commit` and `pre-push` hooks using Husky.

### Fixed

- Add `.node-version` to enforce Node.js version `>= 24.*`
  (to avoid Cloudflare using v22 to run TypeScript directly).
- Add `lcov` to Vitest reporters for Codecov.
- Fix links in `README.md` and added documentation link.
- Correct published output file declarations in `package.json`.

## [0.1.0] - 2025-11-09

Initial release

### Added

- Core fetch-based Airtable client:
  - `AirtableCoreClient` with:
    - Configurable `endpointUrl`, `fetch`, `maxRetries`, `retryInitialDelayMs`, `retryOnStatuses`
    - Shared URL builders: `buildTableUrl`, `buildMetaUrl`, `buildBaseUrl`
    - Query builders: `buildListQuery`, `buildGetQuery`, `buildReturnFieldsQuery`
    - HTTP layer with:
      - Authorization header injection
      - JSON parsing
      - Retry with exponential backoff and jitter
      - Respect for `Retry-After` header
- High-level `AirtableClient` composed from:
  - `client.records` – records CRUD and listing
  - `client.metadata` – bases & schema metadata
  - `client.webhooks` – base-level webhooks

### Records API

- `client.records.listRecords` – single-page list with all Airtable query options
- `client.records.listAllRecords` – auto-pagination with optional `maxRecords` cap
- `client.records.iterateRecords` – async iterator over records, streaming across pages
- `client.records.getRecord` – retrieve a single record by ID
- `client.records.createRecords` – batched creation with:
  - Automatic splitting into `MAX_RECORDS_PER_BATCH` (10) per request
  - `typecast` and `returnFieldsByFieldId` options
- `client.records.updateRecords` – batch update / upsert with:
  - `performUpsert.fieldsToMergeOn`
  - `typecast` and `returnFieldsByFieldId`
  - Aggregated `records`, `createdRecords`, `updatedRecords`
- `client.records.updateRecord` – convenience helper for single-record updates
- `client.records.deleteRecord` – delete a single record by ID
- `client.records.deleteRecords` – batched deletion with `records[]=id` encoding

### Metadata API

- `client.metadata.listBases` – list bases visible to the current token
- `client.metadata.listAllBases` – auto-paginated list of all bases
- `client.metadata.getBaseSchema` – base-wide schema (tables, fields, views)
- `client.metadata.getTableSchema` – table schema by ID or name
- `client.metadata.getViewMetadata` – view metadata by ID or name

### Webhooks API

- `client.webhooks.createWebhook` – create base-level webhooks
- `client.webhooks.listWebhooks` – list webhooks for a base
- `client.webhooks.deleteWebhook` – delete a webhook by ID
- `client.webhooks.refreshWebhook` – extend webhook expiration
- `client.webhooks.listWebhookPayloads` – paginate webhook payloads with cursor support

### Airtable.js-style facade

- Global singleton `Airtable` with:
  - `Airtable.configure({ apiKey, endpointUrl?, fetch?, maxRetries?, retryInitialDelayMs?, retryOnStatuses? })`
  - `Airtable.base<TDefaultFields>(baseId)` returning a base function:
    - `base.id` – base ID
    - `base.client` – underlying `AirtableClient` instance
    - `base(tableName)` returning table helpers:
      - `.select(params).all()`
      - `.select(params).firstPage()`
      - `.find(recordId, params?)`
      - `.create(records, options?)`
      - `.update(records, options?)`
      - `.updateRecord(recordId, fields, options?)`
      - `.destroy(recordId)`
      - `.destroyMany(recordIds)`

### Error handling

- `AirtableError` class:
  - Exposes `status`, optional `type`, and raw `payload`
  - Derives message from `payload.error.message` when available
- `isAirtableError` type guard to distinguish Airtable API errors from other exceptions

### Tooling & DX

- Full TypeScript definitions for:
  - Records, metadata, webhooks, query/response shapes, and error payloads
- VitePress documentation site:
  - Getting started guide
  - API reference backed by Typedoc
- Typedoc post-processing script:
  - Cleans up generated markdown (headings, generics, index sections)
  - Normalizes directory names (e.g. `classes` → `Classes`, `type-aliases` → `Type Aliases`)
  - Preserves custom `docs/api/index.md`
  - Rewrites “Defined in: …” to link to the corresponding GitHub blob at the current version
- Testing:
  - Vitest test suite with very high coverage (core, records, metadata, webhooks, facade)
  - Retry logic, error wrapping, and batching behavior covered by tests
- Linting & build:
  - ESLint configuration
  - Typed build output suitable for modern bundlers and Node.js environments
