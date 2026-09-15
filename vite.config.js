import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        // Use the numeric IPv4 address (not "localhost") so Windows doesn't try
        // both ::1 and 127.0.0.1 and flood sockets (ENOBUFS proxy errors).
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
})
