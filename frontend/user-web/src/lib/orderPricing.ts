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
