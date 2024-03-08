import { defineConfig } from 'vite'
import inject from '@rollup/plugin-inject'

export default defineConfig({
  // define: {
  //   global: 'globalThis',
  //   '__DEV__': true,
  //   'process.env': {
  //     ATKIT_ENV: 'development',
  //     SKIA_URI: '/canvaskit.wasm',
  //     ATKIT_ASSETS_ROOT_DIR: '/assets',
  //     ATKIT_ASSETS_BASE_URI: '/'
  //   },
  // },
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
        '@at/api',
        '@at/engine',
        '@at/geometry',
        '@at/document',
        '@at/asset',
        '@at/basic',
        '@at/gesture',
        '@at/mouse',
        '@at/painting',
        '@at/ui',
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
