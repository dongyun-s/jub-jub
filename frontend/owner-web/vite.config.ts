import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** `frontend/.env` — user-web 과 동일 */
const envDir = path.resolve(__dirname, '..')
const workspaceNodeModules = path.resolve(__dirname, '../../node_modules')

function isNgrokTarget(target: string): boolean {
  try {
    const host = new URL(target).hostname
    return host.endsWith('ngrok-free.dev') || host.endsWith('ngrok.io') || host.endsWith('ngrok.app')
  } catch {
    return false
  }
}

function backendProxy(target: string): ProxyOptions {
  const opts: ProxyOptions = { target, changeOrigin: true }
  if (isNgrokTarget(target)) {
    opts.configure = (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('ngrok-skip-browser-warning', '69420')
      })
    }
  }
  return opts
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080'

  return {
    envDir,
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
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': backendProxy(proxyTarget),
        '/orders': backendProxy(proxyTarget),
        '/payments': backendProxy(proxyTarget),
      },
    },
  }
})
