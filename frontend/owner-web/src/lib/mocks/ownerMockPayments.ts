export type MockPaymentStatus = 'completed' | 'refunded' | 'pending_settlement' | 'settled'

export type MockOwnerPayment = {
  paymentId: string
  orderNo: string
  summary: string
  paidAtLabel: string
  paidAtIso: string
  amount: number
  platformFee: number
  netAmount: number
  method: string
  status: MockPaymentStatus
}

export type MockSettlementAccount = {
  bankName: string
  accountNumberMasked: string
  holderName: string
  nextPayoutLabel: string
}

export const MOCK_SETTLEMENT_ACCOUNT: MockSettlementAccount = {
  bankName: '카카오뱅크',
  accountNumberMasked: '3333-**-******12',
  holderName: '줍줍키친강남',
  nextPayoutLabel: '매주 수요일 15:00 정산',
}

export const MOCK_OWNER_PAYMENTS: MockOwnerPayment[] = [
  {
    paymentId: 'pay-8825-02',
    orderNo: '8825-02',
    summary: '제육 덮밥 · 생딸기 에이드',
    paidAtLabel: '오늘 14:32',
    paidAtIso: '2026-05-27T14:32:00+09:00',
    amount: 20500,
    platformFee: 615,
    netAmount: 19885,
    method: '토스페이',
    status: 'pending_settlement',
  },
  {
    paymentId: 'pay-8824-01',
    orderNo: '8824-01',
    summary: '시그니처 불고기 비빔밥',
    paidAtLabel: '오늘 14:18',
    paidAtIso: '2026-05-27T14:18:00+09:00',
    amount: 14000,
    platformFee: 420,
    netAmount: 13580,
    method: '신용카드',
    status: 'pending_settlement',
  },
  {
    paymentId: 'pay-8824-00',
    orderNo: '8824-00',
    summary: '숙성 묵은지 김치찌개 · 공기밥',
    paidAtLabel: '오늘 13:55',
    paidAtIso: '2026-05-27T13:55:00+09:00',
    amount: 13200,
    platformFee: 396,
    netAmount: 12804,
    method: '카카오페이',
    status: 'pending_settlement',
  },
  {
    paymentId: 'pay-8823-99',
    orderNo: '8823-99',
    summary: '갈릭 허니 가라아게 세트',
    paidAtLabel: '오늘 13:20',
    paidAtIso: '2026-05-27T13:20:00+09:00',
    amount: 18900,
    platformFee: 567,
    netAmount: 18333,
    method: '네이버페이',
    status: 'completed',
  },
  {
    paymentId: 'pay-8823-98',
    orderNo: '8823-98',
    summary: '트러플 크림 파스타',
    paidAtLabel: '어제 19:41',
    paidAtIso: '2026-05-26T19:41:00+09:00',
    amount: 16500,
    platformFee: 495,
    netAmount: 16005,
    method: '신용카드',
    status: 'settled',
  },
  {
    paymentId: 'pay-8823-97',
    orderNo: '8823-97',
    summary: '제육 덮밥 (취소 환불)',
    paidAtLabel: '어제 18:02',
    paidAtIso: '2026-05-26T18:02:00+09:00',
    amount: 11000,
    platformFee: 0,
    netAmount: 0,
    method: '토스페이',
    status: 'refunded',
  },
  {
    paymentId: 'pay-8823-96',
    orderNo: '8823-96',
    summary: '생딸기 리얼 에이드 2잔',
    paidAtLabel: '어제 17:15',
    paidAtIso: '2026-05-26T17:15:00+09:00',
    amount: 13000,
    platformFee: 390,
    netAmount: 12610,
    method: '카카오페이',
    status: 'settled',
  },
]

export function getMockPaymentSummary(payments: MockOwnerPayment[]) {
  const todayPrefix = '오늘'
  const todayGross = payments
    .filter((p) => p.status !== 'refunded' && p.paidAtLabel.startsWith(todayPrefix))
    .reduce((s, p) => s + p.amount, 0)
  const pendingNet = payments
    .filter((p) => p.status === 'pending_settlement')
    .reduce((s, p) => s + p.netAmount, 0)
  const lastSettled = payments.find((p) => p.status === 'settled')
  return {
    todayGross,
    pendingNet,
    lastSettledNet: lastSettled?.netAmount ?? 0,
    lastSettledLabel: lastSettled?.paidAtLabel ?? '—',
    count: payments.filter((p) => p.status !== 'refunded').length,
  }
}

export function paymentStatusLabel(status: MockPaymentStatus): string {
  switch (status) {
    case 'pending_settlement':
      return '정산 예정'
    case 'settled':
      return '정산 완료'
    case 'refunded':
      return '환불'
    default:
      return '결제 완료'
  }
}
