import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
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
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  },
  plugins: [
    react(),
    nodePolyfills(),
    {
      name: 'isolation',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

          next()
        })
      },
    }
  ],
})
