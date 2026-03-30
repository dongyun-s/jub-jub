/**
 * Tmap JavaScript API v2
 *
 * 스크립트는 vite.config.ts transformIndexHtml 로 index.html 에 동기 로드됨(document.write 대응).
 * 이 모듈은 Tmapv2 준비 여부만 짧게 폴링합니다.
 *
 * @see https://openapi.sk.com
 */

const POLL_MS = 50
const POLL_MAX = 200

function getTmapv2Ready(): boolean {
  const w = window as unknown as { Tmapv2?: { Map?: unknown } }
  return Boolean(w.Tmapv2?.Map)
}

export function loadTmapScript(appKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window 없음'))
  }

  const key = appKey?.trim()
  if (!key) {
    return Promise.reject(
      new Error('VITE_TMAP_APP_KEY가 없습니다. frontend/.env 설정 후 dev 서버를 재시작하세요.')
    )
  }

  if (getTmapv2Ready()) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    let n = 0
    const id = window.setInterval(() => {
      if (getTmapv2Ready()) {
        window.clearInterval(id)
        resolve()
      } else if (++n >= POLL_MAX) {
        window.clearInterval(id)
        reject(
          new Error(
            '티맵 SDK(Tmapv2)를 찾을 수 없습니다. 앱키·콘솔 Web URL·네트워크를 확인하고 dev 서버를 재시작하세요.'
          )
        )
      }
    }, POLL_MS)
  })
}
