// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import DocFooter from './components/DocFooter.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      DefaultTheme.Layout,
      { class: 'zla-layout' },
      {
        'doc-after': () => h(DocFooter),
      },
    )
  },
  // enhanceApp({ app, router, siteData }) {
  //   // ...
  // },
} satisfies Theme
