import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiTarget = env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/orders': { target: apiTarget, changeOrigin: true },
        '/payments': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
