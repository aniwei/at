import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        '@at/basic',
        '@at/utils',
        '@at/engine',
        '@at/geometry',
      ]
    }
  },
})
