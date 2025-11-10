---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Airtable TS'
  text: 'A tiny, modern Airtable Web API client'
  tagline: 'Fetch-based, TypeScript-first, with Airtable.js-style façade plus metadata & webhooks.'
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
    title: Tiny & fetch-based
    details: Minimal runtime, no bloat. Uses standard fetch in Node 18+ or any custom implementation you provide.
  - icon: 🧩
    title: Airtable.js-style façade
    details: Familiar Airtable.configure + Airtable.base syntax on top, with a well-structured core client underneath.
  - icon: 🧠
    title: TypeScript-first
    details: Strongly-typed records, metadata, webhooks and errors, with generics that match your Airtable schema.
  - icon: 🔁
    title: Built-in retries
    details: Exponential backoff, jitter and Retry-After support for smoother handling of rate limits and flaky networks.
---
