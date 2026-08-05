import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
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

/** 서비스키 없으면 국세청 프록시 대신 501 JSON */
function ntsKeyGuardPlugin(serviceKey: string): Plugin {
  return {
    name: 'nts-business-key-guard',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/owner-ext/nts-business')) {
          next()
          return
        }
        if (serviceKey) {
          next()
          return
        }
        res.statusCode = 501
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            msg: 'NTS_BUSINESS_SERVICE_KEY 가 frontend/.env 에 없습니다. 키 입력 후 owner-web을 재시작하세요.',
          }),
        )
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080'
  /** 공공데이터포털 국세청 사업자 진위확인 — 클라이언트 번들 미포함 */
  const ntsServiceKey = (env.NTS_BUSINESS_SERVICE_KEY || env.VITE_NTS_BUSINESS_SERVICE_KEY || '').trim()
  const ntsKeyQuery = ntsServiceKey.includes('%') ? ntsServiceKey : encodeURIComponent(ntsServiceKey)

  return {
    envDir,
    plugins: [react(), ntsKeyGuardPlugin(ntsServiceKey)],
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
        /** /api 백엔드 프록시와 분리 */
        '/owner-ext/nts-business': {
          target: 'https://api.odcloud.kr',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => {
            const pathOnly = p.replace(/^\/owner-ext\/nts-business/, '/api/nts-businessman/v1')
            if (!ntsKeyQuery) return pathOnly
            // 이미 인코딩된 키는 그대로, 아니면 encode — 이중 인코딩 방지
            const sep = pathOnly.includes('?') ? '&' : '?'
            return `${pathOnly}${sep}serviceKey=${ntsKeyQuery}`
          },
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              const r = res as { writeHead?: (code: number, h: Record<string, string>) => void; end?: (b: string) => void; headersSent?: boolean }
              if (!r?.writeHead || r.headersSent) return
              r.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
              r.end(
                JSON.stringify({
                  msg: `국세청(공공데이터) API에 연결하지 못했습니다. (${err.message || 'network error'}) 네트워크·방화벽을 확인하거나, 형식 검증만으로 가입을 진행할 수 있습니다.`,
                }),
              )
            })
          },
        },
        '/api': backendProxy(proxyTarget),
        '/orders': backendProxy(proxyTarget),
        '/payments': backendProxy(proxyTarget),
      },
    },
  }
})
