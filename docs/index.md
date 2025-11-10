---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Airtable TS'
  text: 'A tiny, modern Airtable Web and Node API client'
  tagline: 'Fetch-based, TypeScript-first. Airtable.js-style façade plus metadata, webhooks and optional record caching.'
  image:
    src: /favicon.svg
    alt: 'Airtable TS Logo'
  actions:
    - theme: brand
      text: 🛠️ Get Started
      link: /guide/getting-started
    - theme: alt
      text: 📚 API Reference
      link: /api/
    - theme: alt
      text: ⭐ NPM
      link: https://www.npmjs.com/package/ts-airtable

features:
  - icon: ⚡
    title: Tiny, fetch-based & edge-ready
    details: Minimal runtime, no bloat. Uses standard fetch and runs in Node 18+, modern browsers and most edge runtimes that support fetch.
  - icon: 🧩
    title: Airtable.js-style façade
    details: Familiar Airtable.configure + Airtable.base syntax on top of a small core client for records, metadata and webhooks.
  - icon: 🧊
    title: Optional record caching
    details: Pluggable record cache for list/get operations, with a built-in in-memory LRU+TTL store and automatic invalidation on mutations.
  - icon: 🔁
    title: Built-in retries
    details: Exponential backoff, jitter and Retry-After support for smoother handling of rate limits and flaky networks.
---
