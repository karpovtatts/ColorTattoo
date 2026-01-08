import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')
  
  // Base path: из .env.production или явно для production
  const basePath = mode === 'production' 
    ? (env.VITE_BASE_PATH || '/colortattoo/')
    : '/'
  
  return {
    base: basePath,
    
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0', // Слушать на всех интерфейсах (IPv4 и IPv6)
      open: true,
    },
  }
})

