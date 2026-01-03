import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ADMIN PANEL - Port 7001
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Explicitly bind to IPv4 localhost
    port: 7001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})