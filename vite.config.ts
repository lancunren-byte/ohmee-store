import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isCapacitor = process.env.BUILD_TARGET === 'app'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Capacitor 打包时使用相对路径，Web 部署时使用 '/'
  base: isCapacitor ? './' : '/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
})
