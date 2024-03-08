import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './lib/index.ts',
      }, 
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        '@at/basic',
        '@at/utils'
      ]
    }
  },
  plugins: [
    {
      name: 'isolation',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

          next()
        })
      },
    },
  ],
  test: {}
})
