import type { DefaultTheme, UserConfig } from 'vitepress'
import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import pkg from '../../package.json' with { type: 'json' }

const apiSidebar: DefaultTheme.Sidebar = generateSidebar([
  {
    documentRootPath: 'docs', // .vitepress 所在目录
    scanStartPath: 'api', // 扫描 docs/api 下的文件
    resolvePath: '/api/', // 生成的链接前缀 => /api/...
    useTitleFromFileHeading: true,
    useFolderLinkFromIndexFile: true,
    rootGroupText: 'API Reference',
  },
])

// https://vitepress.dev/reference/site-config
const vitePressConfig: UserConfig<DefaultTheme.Config> = {
  lang: 'en-US',
  title: 'Airtable TS',
  description: 'A community version of Javascript and TypeScript client for Airtable.',
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
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/guide/features/' },
      { text: 'API Reference', link: '/api/' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/ZL-Asica/ts-airtable/blob/main/CHANGELOG.md',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'npm', link: 'https://www.npmjs.com/package/ts-airtable' },
      { icon: 'github', link: 'https://github.com/ZL-Asica/ts-airtable' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright:
        'Copyright &copy; 2025-Present <a href="https://zla.pub" target="_blank">ZL Asica</a>',
    },
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Records', link: '/guide/records' },
            { text: 'Metadata', link: '/guide/metadata' },
            { text: 'Webhooks', link: '/guide/webhooks' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Features overview', link: '/guide/features/' },
            { text: 'Caching', link: '/guide/features/caching' },
            { text: 'Custom cache store example (Cloudflare KV)', link: '/guide/features/custom-cloudflare-kv-cache' },
          ],
        },
      ],
      ...apiSidebar,
    },
  },
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://airtable.zla.app',
  },
}

export default defineConfig(vitePressConfig)
