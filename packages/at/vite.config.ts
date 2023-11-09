import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    global: 'globalThis',
    '__DEV__': true,
    'process.env': {
      NODE_ENV: 'development',
      SKIA_URI: '/canvaskit.wasm',
      ROOT_DIR: '/assets',
      BASE_URI: '/'
    },
  },
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        '@at/api',
        '@at/engine',
        '@at/geometry',
        '@at/utils',
        'canvaskit-wasm',
      ]
    }
  },
  plugins: [
    // inject({
    //   process: 'process/browser'
    // })
  ],
})
