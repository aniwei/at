import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        'ts-invariant',
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
