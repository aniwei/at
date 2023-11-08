import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        '@at/basic',
        '@at/core',
        '@at/engine',
        '@at/geometry',
        'path-browserify'
      ]
    }
  },
  resolve: {
    alias: {
      path: 'path-browserify'
    }
  }
})
