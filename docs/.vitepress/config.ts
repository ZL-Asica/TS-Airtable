import type { DefaultTheme, UserConfig } from 'vitepress'

import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'

import pkg from '../../package.json' with { type: 'json' }

// https://vitepress.dev/reference/site-config
const vitePressConfig: UserConfig<DefaultTheme.Config> = {
  lang: 'en-US',
  title: 'Airtable TS',
  description: 'A community version of TypeScript client for Airtable.',
  cleanUrls: true,
  head: [
    ['meta', { name: 'keywords', content: 'airtable, typescript, javascript, client, zl-asica' }],
    ['meta', { name: 'author', content: 'ZL Asica' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Airtable TS' }],
    ['meta', { name: 'robots', content: 'noindex,nofollow,noarchive' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: `v${pkg.version}`, items: [
        { text: 'Changelog', link: 'https://github.com/ZL-Asica/ts-airtable/blob/main/CHANGELOG.md' },
      ] },
    ],
    socialLinks: [
      // { icon: 'jsr', link: 'https://jsr.io/@zl-asica/ts-airtable' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/ts-airtable' },
      { icon: 'github', link: 'https://github.com/ZL-Asica/ts-airtable' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright &copy; 2025-Present <a href="https://zla.pub" target="_blank">ZL Asica</a>',
    },
  },
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://airtable.zla.app',
  },
}

export default defineConfig(
  withSidebar(vitePressConfig, [
    {
      documentRootPath: 'docs',
      scanStartPath: 'guide',
      basePath: '/guide/',
      resolvePath: '/guide/',
      useTitleFromFileHeading: true,
      rootGroupText: 'Guide',
    },
    {
      documentRootPath: 'docs',
      scanStartPath: 'api',
      resolvePath: '/api/',
      useTitleFromFileHeading: true,
      rootGroupText: 'API Reference',
      useFolderLinkFromIndexFile: true,
    },
  ]),
)
