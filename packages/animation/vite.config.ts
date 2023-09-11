import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.ts',
      name: 'index',
      fileName: 'index'
    }
  },
  rollupOptions: {
    external: ['@at/basic'],
    output: {
      globals: {
        "@at/basic": "@at/basic",
      },
    },
  }
})
