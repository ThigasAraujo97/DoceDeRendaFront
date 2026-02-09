import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [
        ['@babel/plugin-syntax-typescript', { isTSX: true }]
      ]
    }
  })],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5150',
        changeOrigin: true,
      }
    }
  }
})
