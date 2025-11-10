<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

const { site } = useData()

const footerMessage = computed(() => {
  const footer = site.value.themeConfig?.footer
  return footer && 'message' in footer ? footer.message : ''
})

const copyright = computed(() => {
  const footer = site.value.themeConfig?.footer
  return footer && 'copyright' in footer ? footer.copyright : ''
})
</script>

<template>
  <footer
    class="zla-doc-footer"
    aria-labelledby="zla-doc-footer-title"
    aria-describedby="zla-doc-footer-disclaimer"
  >
    <!-- agent + contribution -->
    <div class="zla-doc-footer-card">
      <div class="zla-doc-footer-top">
        <div class="zla-doc-footer-label">
          <span
            class="zla-doc-footer-dot"
            aria-hidden="true"
            role="presentation"
          />
          <div class="zla-doc-footer-text">
            <span
              id="zla-doc-footer-title"
              class="zla-doc-footer-title"
            >
              This page is auto generated based on source code.
            </span>
            <span
              id="zla-doc-footer-sub"
              class="zla-doc-footer-sub"
            >
              If something looks incorrect or underspecified, please open a documentation issue to help us improve.
            </span>
          </div>
        </div>

        <div class="zla-doc-footer-actions">
          <a
            href="https://github.com/ZL-Asica/TS-Airtable/issues/new?template=documentation_update.yml"
            class="zla-doc-footer-chip"
            aria-describedby="zla-doc-footer-sub"
          >
            <span class="zla-doc-footer-chip-label">
              Open documentation issue
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Legal / distribution -->
    <p
      v-if="footerMessage"
      id="zla-doc-footer-disclaimer"
      class="zla-doc-footer-disclaimer"
      v-html="footerMessage"
    />

    <!-- Copyright from VitePress config -->
    <p
      v-if="copyright"
      class="zla-doc-footer-copyright"
      v-html="copyright"
    />
  </footer>
</template>

<style scoped>
.zla-doc-footer {
  margin-top: 2.5rem;
  margin-bottom: -6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Card */

.zla-doc-footer-card {
  padding: 1rem 1.3rem 0.85rem;
  border-radius: 14px;
  border: 1px solid var(--vp-c-border);
  background:
    linear-gradient(135deg, color-mix(in oklab, var(--vp-c-brand-soft) 55%, transparent), transparent 60%),
    var(--vp-c-bg-soft);
}

.zla-doc-footer-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.zla-doc-footer-label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.zla-doc-footer-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--vp-c-brand-2);
  box-shadow: 0 0 0 6px color-mix(in oklab, var(--vp-c-brand-soft) 60%, transparent);
}

.zla-doc-footer-text {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.zla-doc-footer-title {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.zla-doc-footer-sub {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.zla-doc-footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.zla-doc-footer-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--vp-c-brand-2) 55%, transparent);
  background: color-mix(in oklab, var(--vp-c-brand-soft) 70%, transparent);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: none;
  color: var(--vp-c-brand-2);
  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    transform 0.12s ease-out,
    box-shadow 0.16s ease-out;
}

.zla-doc-footer-chip:hover {
  transform: translateY(-1px);
  border-color: var(--vp-c-brand-2);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
}

.zla-doc-footer-chip-label {
  white-space: nowrap;
}

/* Legal + copyright */

.zla-doc-footer-disclaimer {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.zla-doc-footer-copyright {
  margin: 0;
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

/* Responsive */

@media (max-width: 640px) {
  .zla-doc-footer-top {
    align-items: flex-start;
  }

  .zla-doc-footer-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
