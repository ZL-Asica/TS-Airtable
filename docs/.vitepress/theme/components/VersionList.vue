<script setup lang="ts">
import versions from '../../../versions.json' with { type: 'json' }

interface DocsVersionEntry {
  version: string
  channel: 'stable' | 'prerelease'
  label: string
  path: string
  npmTag: 'latest' | 'beta'
  generatedFrom: string
  date: string
}

const docsVersions = versions as DocsVersionEntry[]
</script>

<template>
  <div class="zla-version-list">
    <a
      v-for="version in docsVersions"
      :key="version.version"
      class="zla-version-card"
      :href="version.path"
    >
      <span class="zla-version-main">
        <span class="zla-version-title">{{ version.label }}</span>
        <span
          class="zla-version-badge"
          :data-channel="version.channel"
        >
          {{ version.channel }}
        </span>
      </span>
      <span class="zla-version-meta">
        npm {{ version.npmTag }} · generated from {{ version.generatedFrom }} · {{ version.date }}
      </span>
    </a>
  </div>
</template>

<style scoped>
.zla-version-list {
  display: grid;
  gap: 0.75rem;
  margin: 1.25rem 0 2rem;
}

.zla-version-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  background: var(--vp-c-bg-soft);
}

.zla-version-card:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-text-1);
}

.zla-version-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}

.zla-version-title {
  font-weight: 600;
}

.zla-version-badge {
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.zla-version-badge[data-channel='prerelease'] {
  color: var(--vp-c-warning-1);
  background: var(--vp-c-warning-soft);
}

.zla-version-meta {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>
