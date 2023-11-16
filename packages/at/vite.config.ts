import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    global: 'globalThis',
    '__DEV__': true,
    'process.env': {
      ATKIT_ENV: 'development',
      SKIA_URI: '/canvaskit.wasm',
      ATKIT_ASSETS_ROOT_DIR: '/assets',
      ATKIT_ASSETS_BASE_URI: '/'
    },
  },
  build: {
    lib: {
      entry: {
        index: './lib/index.ts',
        'boot': './lib/boot.ts',
        'proxy': './lib/proxy.ts',
      }, 
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        // '@at/api',
        // '@at/engine',
        // '@at/geometry',
        // '@at/utils',
        // 'canvaskit-wasm',
      ]
    }
  },
  plugins: [
    // inject({
    //   process: 'process/browser'
    // })
  ],
})
