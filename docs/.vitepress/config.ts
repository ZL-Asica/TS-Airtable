import type { DefaultTheme, UserConfig } from 'vitepress'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import pkg from '../../package.json' with { type: 'json' }

const apiSidebar: DefaultTheme.Sidebar = generateSidebar([
  {
    documentRootPath: 'docs', // .vitepress directory
    scanStartPath: 'api', // Scan files under docs/api
    resolvePath: '/api/', // Generated link prefix => /api/...
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
  transformPageData(pageData, ctx) {
    const rel = pageData.relativePath

    if (rel === 'api/index.md') {
      try {
        // docs directory (srcDir)'s parent directory
        const srcDir = ctx.siteConfig.srcDir
        // The actual file in Git
        const sourcePath = path.join(srcDir, 'api.index.md')

        // Fetch the last updated timestamp in ms
        const ts = execSync(`git log -1 --pretty=%ct -- "${sourcePath}"`, {
          encoding: 'utf8',
        }).trim()

        if (ts) {
          pageData.lastUpdated = Number(ts) * 1000
        }
      }
      catch (e) {
        // If the git command fails, keep the default behavior (possibly undefined)
        console.warn('failed to get lastUpdated for api.index.md', e)
      }
    }

    // Only keep index of /api/. Hide all other /api/** editLink
    if (rel?.startsWith('api') && !rel.endsWith('index.md')) {
      pageData.frontmatter = {
        ...pageData.frontmatter,
        editLink: false,
        lastUpdated: false,
      }
    }
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/guide/features/' },
      { text: 'API Reference', link: '/api/' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/ZL-Asica/TS-Airtable/blob/main/CHANGELOG.md',
          },
          {
            text: 'Contributing',
            link: 'https://github.com/ZL-Asica/TS-Airtable/blob/main/CONTRIBUTING.md',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'npm', link: 'https://www.npmjs.com/package/ts-airtable' },
      { icon: 'github', link: 'https://github.com/ZL-Asica/TS-Airtable' },
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
    editLink: {
      pattern: ({ filePath }) => {
        const base = 'https://github.com/ZL-Asica/TS-Airtable/edit/main/docs'

        // `filePath` should be "api/index.html"
        const isAPIIndex = filePath.startsWith('api/') && filePath.endsWith('index.md')

        if (isAPIIndex) {
          // Index files live directly under `docs/` as `api.index.md`
          return `${base}/api.index.md`
        }

        // files in `guide` folder map directly
        // Other files are generated, should not be able to be edited.
        // handled by `transformPageData` above.
        return `${base}/${filePath}`
      },
    },
  },
  lastUpdated: true,
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://airtable.zla.app',
  },
}

export default defineConfig(vitePressConfig)
