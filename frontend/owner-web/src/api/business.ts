/**
 * 국세청 사업자등록정보 진위확인 (공공데이터포털)
 * - 브라우저 → `/owner-ext/nts-business/status` (Vite 프록시)
 * - 서비스키는 frontend/.env 의 NTS_BUSINESS_SERVICE_KEY (클라이언트 번들 미포함)
 */

export type BizStatusCode = '01' | '02' | '03' | 'unknown'

export type BizVerifyResult = {
  ok: boolean
  businessNumber: string
  statusCode: BizStatusCode
  statusLabel: string
  taxType?: string
  message: string
  /** 국세청 미연결로 체크섬만 통과한 경우 */
  checksumOnly?: boolean
}

type NtsStatusItem = {
  b_no?: string
  b_stt?: string
  b_stt_cd?: string
  tax_type?: string
  tax_type_cd?: string
  end_dt?: string
  utcc_yn?: string
  message?: string
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** 사업자등록번호 체크섬 (API 전 1차 검증) */
export function isValidBusinessNumberChecksum(raw: string): boolean {
  const n = digitsOnly(raw)
  if (n.length !== 10) return false
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number(n[i]) * weights[i]
  }
  sum += Math.floor((Number(n[8]) * 5) / 10)
  const check = (10 - (sum % 10)) % 10
  return check === Number(n[9])
}

export function formatBusinessNumber(raw: string): string {
  const d = digitsOnly(raw)
  if (d.length !== 10) return raw.trim()
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function mapStatus(code?: string): { statusCode: BizStatusCode; statusLabel: string; ok: boolean } {
  if (code === '01') return { statusCode: '01', statusLabel: '계속사업자', ok: true }
  if (code === '02') return { statusCode: '02', statusLabel: '휴업자', ok: false }
  if (code === '03') return { statusCode: '03', statusLabel: '폐업자', ok: false }
  return { statusCode: 'unknown', statusLabel: '확인 불가', ok: false }
}

function checksumFallback(businessNumber: string, detail: string): BizVerifyResult {
  return {
    ok: true,
    businessNumber,
    statusCode: '01',
    statusLabel: '형식 확인',
    checksumOnly: true,
    message: `사업자번호 형식은 올바릅니다. (국세청 API 일시 불가 · ${detail})`,
  }
}

/**
 * POST /owner-ext/nts-business/status
 * Vite가 국세청 API로 프록시하며 serviceKey를 붙입니다.
 */
export async function verifyBusinessNumber(raw: string): Promise<BizVerifyResult> {
  const businessNumber = digitsOnly(raw)
  if (businessNumber.length !== 10) {
    return {
      ok: false,
      businessNumber,
      statusCode: 'unknown',
      statusLabel: '형식 오류',
      message: '사업자번호 10자리를 입력해 주세요.',
    }
  }
  if (!isValidBusinessNumberChecksum(businessNumber)) {
    return {
      ok: false,
      businessNumber,
      statusCode: 'unknown',
      statusLabel: '형식 오류',
      message: '사업자번호 형식이 올바르지 않습니다. 숫자를 다시 확인해 주세요.',
    }
  }

  let res: Response
  try {
    res = await fetch('/owner-ext/nts-business/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ b_no: [businessNumber] }),
    })
  } catch {
    return checksumFallback(businessNumber, '네트워크 오류')
  }

  if (res.status === 501) {
    return {
      ok: false,
      businessNumber,
      statusCode: 'unknown',
      statusLabel: '키 미설정',
      message:
        'NTS_BUSINESS_SERVICE_KEY 가 frontend/.env 에 없습니다. 공공데이터포털 인증키를 넣은 뒤 owner-web을 재시작하세요.',
    }
  }

  // Vite 프록시가 국세청에 못 붙으면 502/503
  if (res.status === 502 || res.status === 503) {
    const text = await res.text().catch(() => '')
    let detail = '공공데이터포털 연결 실패'
    try {
      const j = text ? (JSON.parse(text) as { msg?: string }) : null
      if (j?.msg) detail = j.msg
    } catch {
      /* ignore */
    }
    return checksumFallback(businessNumber, detail)
  }

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'msg' in body
        ? String((body as { msg?: string }).msg)
        : text.slice(0, 200) || `사업자 확인 요청 실패 (${res.status})`
    // 키/쿼터 오류 등은 형식만 통과시키지 않고 실패로 유지하되, 5xx는 위에서 처리
    return {
      ok: false,
      businessNumber,
      statusCode: 'unknown',
      statusLabel: '요청 실패',
      message: msg,
    }
  }

  const data = body as { data?: NtsStatusItem[]; status_code?: string; message?: string } | null
  const item = Array.isArray(data?.data) ? data!.data![0] : null
  if (!item) {
    return {
      ok: false,
      businessNumber,
      statusCode: 'unknown',
      statusLabel: '응답 없음',
      message: data?.message || '사업자 정보를 확인할 수 없습니다.',
    }
  }

  const mapped = mapStatus(item.b_stt_cd)
  const taxType = item.tax_type?.trim() || undefined
  if (mapped.ok) {
    return {
      ok: true,
      businessNumber,
      statusCode: mapped.statusCode,
      statusLabel: mapped.statusLabel,
      taxType,
      message: taxType ? `확인됨 · ${mapped.statusLabel} (${taxType})` : `확인됨 · ${mapped.statusLabel}`,
    }
  }

  return {
    ok: false,
    businessNumber,
    statusCode: mapped.statusCode,
    statusLabel: mapped.statusLabel,
    taxType,
    message: item.b_stt
      ? `${item.b_stt}${item.end_dt ? ` · 폐업일 ${item.end_dt}` : ''}`
      : `이 사업자번호는 가입에 사용할 수 없습니다. (${mapped.statusLabel})`,
  }
}
