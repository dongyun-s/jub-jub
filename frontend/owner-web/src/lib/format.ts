export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * POS 카드·상세용 짧은 주문번호.
 * `ORD-1-2026-09-18T…`처럼 긴 값은 끝 숫자 위주로, 짧은 값은 그대로.
 */
export function formatOwnerOrderNo(orderNo: string | null | undefined, orderId?: number): string {
  const raw = (orderNo ?? '').trim()
  if (!raw) return orderId != null && orderId > 0 ? String(orderId) : '—'
  if (raw.length <= 10) return raw
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(-6)
  if (orderId != null && orderId > 0) return String(orderId)
  return raw.slice(-8)
}

export function formatReviewDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}.${mm}.${dd} ${hh}:${min}`
}
