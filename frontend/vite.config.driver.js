import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// DRIVER FRONTEND - Port 6001 (changed from 6000 to avoid unsafe port)
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Explicitly bind to IPv4 localhost
    port: 6001, // Changed from 6000 to 6001
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})