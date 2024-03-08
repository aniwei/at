import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './lib/index.ts',
      }, 
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        '@at/geometry',
        '@at/gesture',
        '@at/basic',
        '@at/utils',
        '@at/math'
      ]
    }
  },
  plugins: [],
})
