import type { RewardCalculateResponse } from '../api/rewards'

/** 다회용기 할인 — 서버 주문 생성 시 적용 (명세 7) */
export const ECO_DISCOUNT_AMOUNT = 200

/** POST /rewards/calculate 미리보기 + 다회용기 할인 반영 예상 결제액 */
export function estimateFinalPaymentAmount(
  preview: RewardCalculateResponse | null,
  useMultiUseContainer: boolean,
  fallbackSubtotal: number,
): number {
  if (!preview) {
    return Math.max(0, fallbackSubtotal - (useMultiUseContainer ? ECO_DISCOUNT_AMOUNT : 0))
  }
  return Math.max(0, preview.finalPaymentAmount - (useMultiUseContainer ? ECO_DISCOUNT_AMOUNT : 0))
}

/** PortOne·PG 인증 결제창에 표시할 주문명 (매장명 + 메뉴 요약) */
export function buildPortOneOrderName(
  storeName: string | null | undefined,
  storeId: number | null,
  items: { name: string }[],
  maxLen = 80,
): string {
  const store =
    storeName?.trim() || (storeId != null ? `매장 #${storeId}` : '픽업 매장')
  let menuPart: string
  if (items.length === 0) menuPart = '주문'
  else if (items.length === 1) menuPart = items[0].name
  else menuPart = `${items[0].name} 외 ${items.length - 1}건`

  const raw = `${store} · ${menuPart}`
  if (raw.length <= maxLen) return raw
  return `${raw.slice(0, maxLen - 1)}…`
}
