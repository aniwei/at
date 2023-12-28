
import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // '@at/foundation': path.resolve(__dirname, './src/at/foundation'),
      // '@at/animation': path.resolve(__dirname, './src/at/animation'),
      // '@at/gestures': path.resolve(__dirname, './src/at/gestures'),
      // '@at/ui': path.resolve(__dirname, './src/at/layout'),
      // '@at/engine': path.resolve(__dirname, './src/at/engine'),
      // '@at/painting': path.resolve(__dirname, './src/at/painting'),
      // '@at': path.resolve(__dirname, './src/at/at'),
    }
  }
})
