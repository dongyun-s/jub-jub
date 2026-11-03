/** 다음(카카오) 우편번호 검색 */

export type DaumAddressResult = {
  zonecode: string
  address: string
  roadAddress: string
  jibunAddress: string
  buildingName?: string
}

type DaumPostcodeData = {
  zonecode: string
  address: string
  roadAddress: string
  jibunAddress: string
  buildingName?: string
  apartment?: string
  userSelectedType?: 'R' | 'J'
}

type DaumPostcodeCtor = new (options: {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: (state: string) => void
}) => { open: () => void }

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcodeCtor }
  }
}

const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let scriptPromise: Promise<void> | null = null

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window 없음'))
  if (window.daum?.Postcode) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('우편번호 스크립트 로드 실패')))
      if (window.daum?.Postcode) resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('우편번호 스크립트 로드 실패'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export async function openDaumPostcode(): Promise<DaumAddressResult> {
  await loadDaumPostcodeScript()
  const daum = window.daum
  if (!daum?.Postcode) {
    throw new Error('다음 우편번호 API를 불러오지 못했습니다.')
  }

  return new Promise((resolve, reject) => {
    try {
      new daum.Postcode({
        oncomplete: (data) => {
          const road = data.roadAddress || data.address
          const jibun = data.jibunAddress || data.address
          const base = data.userSelectedType === 'J' ? jibun : road
          const extra =
            data.buildingName && data.apartment === 'Y' ? ` (${data.buildingName})` : data.buildingName ? ` ${data.buildingName}` : ''
          resolve({
            zonecode: data.zonecode,
            address: `${base}${extra}`.trim(),
            roadAddress: road,
            jibunAddress: jibun,
            buildingName: data.buildingName,
          })
        },
        onclose: (state) => {
          if (state === 'FORCE_CLOSE') {
            reject(new Error('주소 검색이 취소되었습니다.'))
          }
        },
      }).open()
    } catch (e) {
      reject(e instanceof Error ? e : new Error('주소 검색을 열 수 없습니다.'))
    }
  })
}
