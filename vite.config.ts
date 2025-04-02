import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const main = resolve(__dirname, 'index.html')
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    minify: false,
    chunkSizeWarningLimit: 1000,
    outDir: resolve(__dirname, 'build'),
    rollupOptions: {
      input: {
        main: main,
      },
    },
  },
})
