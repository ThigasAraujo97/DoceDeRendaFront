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
        target: 'http://18.116.80.216:5000',
        changeOrigin: true,
      }
      ,
      // forward login route (backend exposes POST /login)
      '/login': {
        target: 'http://18.116.80.216:5000',
        changeOrigin: true,
      }
    }
  }
})
