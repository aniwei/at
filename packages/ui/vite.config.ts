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
        '@at/core',
        '@at/asset',
        '@at/engine',
        '@at/basic',
        '@at/gesture',
        '@at/geometry',
        '@at/math',
        '@at/painting',
        '@at/utils',
        '@at/animation',
        // 'canvaskit-wasm'
      ],
    }
  },
})
