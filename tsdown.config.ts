import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  target: ['node18'],
  dts: {
    oxc: true,
  },
  sourcemap: true,
  outDir: 'dist',
  clean: true,
  platform: 'neutral',
})
