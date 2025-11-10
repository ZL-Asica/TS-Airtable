import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  formatters: true,
  typescript: true,
  ignores: [
    'docs/**/*.md',
    'README.md',
  ],
}, {
  files: ['docs/.vitepress/**/*.vue'],
  vue: true,
})
