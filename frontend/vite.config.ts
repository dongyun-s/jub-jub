import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 티맵 jsv2는 document.write를 쓰므로 반드시 HTML 파서가 읽는 동기 스크립트로만 로드 가능.
 * 여기서 .env의 키를 읽어 index.html에 주입합니다.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const tmapKey = env.VITE_TMAP_APP_KEY?.trim()

  return {
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
            const sdkSrc = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${encodeURIComponent(tmapKey)}`
            const iamport = '<script src="https://cdn.iamport.kr/v1/iamport.js"></script>'
            if (!html.includes(iamport)) return html
            return html.replace(iamport, `${iamport}\n    <script src="${sdkSrc}"></script>`)
          },
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: 'https://jayde-proreconciliation-luigi.ngrok-free.dev',
          changeOrigin: true,
        },
      },
    },
  }
})
