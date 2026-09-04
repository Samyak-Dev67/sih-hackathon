import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        citizen: resolve(__dirname, 'citizen.html'),
        university: resolve(__dirname, 'university.html'),
        industry: resolve(__dirname, 'industry.html')
      }
    }
  }
})
