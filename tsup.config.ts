import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  clean: true,
  minify: false,
  dts: true,
  outDir: 'dist',
})
