# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/ZL-Asica/TS-Airtable/compare/v0.4.2...HEAD)

## [0.4.2](https://github.com/ZL-Asica/TS-Airtable/compare/v0.4.1...v0.4.2) - 2026-06-01

This release finalizes the 0.4.2 cycle with Airtable API robustness improvements, dedicated test release-note grouping, expanded coverage, and versioned documentation for stable and prerelease docs.

### 🐛 Bug Fixes / 修复
- fix(records): validate upsert merge field names ([#30](https://github.com/ZL-Asica/TS-Airtable/pull/30)) by @ZL-Asica

### 📖 Documentation / 文档更新
- docs(site): add versioned documentation ([#35](https://github.com/ZL-Asica/TS-Airtable/pull/35)) by @ZL-Asica
- docs: document robustness edge cases ([#31](https://github.com/ZL-Asica/TS-Airtable/pull/31)) by @ZL-Asica

### 🧰 Internal / 内部变更
- ci(release): normalize release PR note links
- ci(release): classify test notes separately ([#34](https://github.com/ZL-Asica/TS-Airtable/pull/34)) by @ZL-Asica

### 🧪 Tests / 测试
- test(records): reach full line coverage ([#33](https://github.com/ZL-Asica/TS-Airtable/pull/33)) by @ZL-Asica
- test(core): cover Airtable error edge cases ([#29](https://github.com/ZL-Asica/TS-Airtable/pull/29)) by @ZL-Asica

### 🔄 Miscellaneous / 其他变更
- release: v0.4.2-beta.0 by @github-actions[bot] in https://github.com/ZL-Asica/TS-Airtable/pull/32

## [0.4.2-beta.0](https://github.com/ZL-Asica/TS-Airtable/compare/v0.4.1...v0.4.2-beta.0) - 2026-06-01

This prerelease improves Airtable-compatible robustness and developer experience for error parsing, rate-limit handling, pagination, upsert validation, and documentation.

### 🐛 Bug Fixes / 修复
- fix(records): validate upsert merge field names ([#30](https://github.com/ZL-Asica/TS-Airtable/pull/30)) by @ZL-Asica

### 📖 Documentation / 文档更新
- docs: document robustness edge cases ([#31](https://github.com/ZL-Asica/TS-Airtable/pull/31)) by @ZL-Asica

### 🧰 Internal / 内部变更
- test(core): cover Airtable error edge cases ([#29](https://github.com/ZL-Asica/TS-Airtable/pull/29)) by @ZL-Asica

## [0.4.1](https://github.com/ZL-Asica/TS-Airtable/compare/v0.4.0...v0.4.1) - 2026-06-01

### 📦 Dependencies / 依赖更新
- chore(deps): update development tooling ([#24](https://github.com/ZL-Asica/TS-Airtable/pull/24)) by @ZL-Asica

### 🧰 Internal / 内部变更
- fix(release): keep package chore notes miscellaneous ([#28](https://github.com/ZL-Asica/TS-Airtable/pull/28)) by @ZL-Asica
- ci(release): fix release PR creation credentials ([#25](https://github.com/ZL-Asica/TS-Airtable/pull/25)) by @ZL-Asica
- ci(release): publish npm from release workflow ([#16](https://github.com/ZL-Asica/TS-Airtable/pull/16)) by @ZL-Asica
- ci(release): read manual version input from event payload ([#17](https://github.com/ZL-Asica/TS-Airtable/pull/17)) by @ZL-Asica
- ci: modernize actions and PR validation ([#19](https://github.com/ZL-Asica/TS-Airtable/pull/19)) by @ZL-Asica
- test(package): verify published package contract ([#20](https://github.com/ZL-Asica/TS-Airtable/pull/20)) by @ZL-Asica
- ci: update pnpm action ([#21](https://github.com/ZL-Asica/TS-Airtable/pull/21)) by @ZL-Asica
- test(package): run contract verifier as TypeScript ([#22](https://github.com/ZL-Asica/TS-Airtable/pull/22)) by @ZL-Asica
- ci(package): test tarball across node versions ([#23](https://github.com/ZL-Asica/TS-Airtable/pull/23)) by @ZL-Asica

### 🔄 Miscellaneous / 其他变更
- chore(release): polish release metadata ([#27](https://github.com/ZL-Asica/TS-Airtable/pull/27)) by @ZL-Asica
- release: v0.4.1-beta.0 by @github-actions[bot] in https://github.com/ZL-Asica/TS-Airtable/pull/26
- chore(package): correct release metadata ([#18](https://github.com/ZL-Asica/TS-Airtable/pull/18)) by @ZL-Asica

## [0.4.1-beta.0](https://github.com/ZL-Asica/TS-Airtable/compare/v0.4.0...v0.4.1-beta.0) - 2026-06-01

### 📦 Dependencies / 依赖更新

- chore(deps): update development tooling ([#24](https://github.com/ZL-Asica/TS-Airtable/pull/24)) by @ZL-Asica

### 🧰 Internal / 内部变更

- ci(release): publish prereleases with beta npm tag ([#26](https://github.com/ZL-Asica/TS-Airtable/pull/26)) by @ZL-Asica
- ci(release): fix release PR creation credentials ([#25](https://github.com/ZL-Asica/TS-Airtable/pull/25)) by @ZL-Asica

### 🔄 Miscellaneous / 其他变更

- ci(release): publish npm from release workflow ([#16](https://github.com/ZL-Asica/TS-Airtable/pull/16)) by @ZL-Asica
- ci(release): read manual version input from event payload ([#17](https://github.com/ZL-Asica/TS-Airtable/pull/17)) by @ZL-Asica
- chore(package): correct release metadata ([#18](https://github.com/ZL-Asica/TS-Airtable/pull/18)) by @ZL-Asica
- ci: modernize actions and PR validation ([#19](https://github.com/ZL-Asica/TS-Airtable/pull/19)) by @ZL-Asica
- test(package): verify published package contract ([#20](https://github.com/ZL-Asica/TS-Airtable/pull/20)) by @ZL-Asica
- ci: update pnpm action ([#21](https://github.com/ZL-Asica/TS-Airtable/pull/21)) by @ZL-Asica
- test(package): run contract verifier as TypeScript ([#22](https://github.com/ZL-Asica/TS-Airtable/pull/22)) by @ZL-Asica
- ci(package): test tarball across node versions ([#23](https://github.com/ZL-Asica/TS-Airtable/pull/23)) by @ZL-Asica

## [0.4.0](https://github.com/ZL-Asica/TS-Airtable/compare/v0.3.1...v0.4.0) - 2026-05-31

This release improves Airtable Web API compatibility, request robustness, release automation, and documentation.

### 🐛 Bug Fixes / 修复
- fix(api): improve Airtable request robustness ([#12](https://github.com/ZL-Asica/TS-Airtable/pull/12)) by @ZL-Asica
### 📖 Documentation / 文档更新
- docs: document request robustness behavior ([#13](https://github.com/ZL-Asica/TS-Airtable/pull/13)) by @ZL-Asica
### 🧰 Internal / 内部变更
- chore(ci): update dependencies and release workflows ([#11](https://github.com/ZL-Asica/TS-Airtable/pull/11)) by @ZL-Asica
- ci(release): align generated notes categories ([#14](https://github.com/ZL-Asica/TS-Airtable/pull/14)) by @ZL-Asica

## [0.3.1](https://github.com/ZL-Asica/TS-Airtable/compare/v0.3.0...v0.3.1) - 2025-12-11

### Fixed

NPM classic token deprecated. Use OIDC to authenticate and publish to NPM registry.

## [0.3.0](https://github.com/ZL-Asica/TS-Airtable/compare/v0.2.3...v0.3.0) - 2025-12-11

### Added

- New attachment URL transformation hook to `AirtableCoreClient` and `AirtableClient`:
  - `transformAttachmentUrl(attachment: Attachment): Promise<string>` option in client config.
  - Allows custom logic to transform Airtable attachment URLs (e.g. re-hosting to S3 / R2 / CDN).
  - Works seamlessly with built-in caching to avoid redundant transformations per `attachment.id`.

## [0.2.3](https://github.com/ZL-Asica/TS-Airtable/compare/v0.2.2...v0.2.3) - 2025-11-10

### Added

- NotFound page layout with i18n support in Vitepress documentation site.
- `Contributting` in header links in Vitepress documentation site.
- Enabled `editlink` and `lastUpdated` for all non-auto-generated pages in Vitepress documentation site.
  - Avoiding generation pages' logic handled by `transformPageData` hook in `config.ts`.

### Changes

- Documentation footer card only display in `api` route now.

### Fixed

- Removed unsupported `@link` tag in Typedoc generated markdown files to avoid warning.

## [0.2.2](https://github.com/ZL-Asica/TS-Airtable/compare/v0.2.1...v0.2.2) - 2025-11-10

### Fixed

- Type import error in `errors.test.ts` file.

## [0.2.1](https://github.com/ZL-Asica/TS-Airtable/compare/v0.2.0...v0.2.1) - 2025-11-10

### Added

- Add missing type defination that official package has.
- Add type conventions that official package did.
- Add more config fileds for better compability with official package (`apiVersion`, `customHeaders`, `noRetryIfRateLimited`)

### Fixed

- Some type minor issues and JSDOC minor comments issues in `client` and `airtable` files.

## [0.2.0](https://github.com/ZL-Asica/TS-Airtable/compare/v0.1.3...v0.2.0) - 2025-11-10

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

## [0.1.3](https://github.com/ZL-Asica/TS-Airtable/compare/v0.1.2...v0.1.3) - 2025-11-09

### Fixed

- Fix npm link in vitepress setting to the right one.
- Rename `CODE_OF_CONDUCT.MD` to `CODE_OF_CONDUCT.md`.

## [0.1.2](https://github.com/ZL-Asica/TS-Airtable/compare/v0.1.1...v0.1.2) - 2025-11-09

### Fixed

- `vue` setting in `eslint.config.mjs`. And turned on a11y for vue part.

## [0.1.1](https://github.com/ZL-Asica/TS-Airtable/compare/v0.1.0...v0.1.1) - 2025-11-09

### Added

- `release.yml` GitHub Actions workflow to publish to npm automatically on tag push.
- `pre-commit` and `pre-push` hooks using Husky.

### Fixed

- Add `.node-version` to enforce Node.js version `>= 24.*`
  (to avoid Cloudflare using v22 to run TypeScript directly).
- Add `lcov` to Vitest reporters for Codecov.
- Fix links in `README.md` and added documentation link.
- Correct published output file declarations in `package.json`.

## [0.1.0](https://github.com/ZL-Asica/TS-Airtable/releases/tag/v0.1.0) - 2025-11-09

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
