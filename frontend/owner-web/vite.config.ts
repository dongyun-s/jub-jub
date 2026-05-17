import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** 저장소 루트(jub-jub)의 node_modules — npm workspaces에서 React는 여기 한 곳에만 있음 */
const workspaceNodeModules = path.resolve(__dirname, '../../node_modules')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiTarget = env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
      alias: {
        react: path.join(workspaceNodeModules, 'react'),
        'react-dom': path.join(workspaceNodeModules, 'react-dom'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
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
