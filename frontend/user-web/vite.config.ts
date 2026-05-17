import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** `frontend/.env` — 패키지 루트가 `frontend/user-web` 이므로 상위 폴더를 지정 */
const envDir = path.resolve(__dirname, '..')

function isNgrokTarget(target: string): boolean {
  try {
    const host = new URL(target).hostname
    return host.endsWith('ngrok-free.dev') || host.endsWith('ngrok.io') || host.endsWith('ngrok.app')
  } catch {
    return false
  }
}

/** ngrok 무료: 서버→ngrok 요청에 헤더 없으면 경고 HTML·404로 막히는 경우가 있음 */
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

/**
 * 티맵 jsv2는 document.write를 쓰므로 반드시 HTML 파서가 읽는 동기 스크립트로만 로드 가능.
 * 여기서 .env의 키를 읽어 index.html에 주입합니다.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_')
  const tmapKey = env.VITE_TMAP_APP_KEY?.trim()
  /** 로컬에서 브라우저 → /api (동일 출처) → 여기로 프록시. ngrok URL은 여기만 넣고 VITE_API_BASE는 비우는 것을 권장(CORS 방지). */
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080'

  return {
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-inject-tmap-sdk',
        transformIndexHtml: {
          /** Vite가 엔트리 스크립트를 head로 옮기기 전에 소스 HTML에 삽입 */
          order: 'pre',
          handler(html: string) {
            if (!tmapKey) return html
            if (html.includes('apis.openapi.sk.com/tmap/jsv2')) return html
            const sdkSrc = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${encodeURIComponent(tmapKey)}`
            const tmapTag = `<script src="${sdkSrc}"></script>`
            const moduleEntry = '<script type="module" src="/src/main.tsx"></script>'
            if (html.includes(moduleEntry)) {
              return html.replace(moduleEntry, `${tmapTag}\n    ${moduleEntry}`)
            }
            return html.replace('</body>', `    ${tmapTag}\n  </body>`)
          },
        },
      },
    ],
    server: {
      proxy: {
        '/api': backendProxy(proxyTarget),
        '/order-tracking': backendProxy(proxyTarget),
        '/orders': backendProxy(proxyTarget),
        '/payments': backendProxy(proxyTarget),
      },
    },
  }
})
