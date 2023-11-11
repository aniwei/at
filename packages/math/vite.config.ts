import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['cjs', 'es']
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        '@at/basic',
        '@at/utils',
        '@at/geometry'
      ]
    }
  }
})
