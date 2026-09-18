import type {
  OwnerOrderDetailDto,
  OwnerOrderSummaryDto,
  OwnerTrackingStatus,
} from '../api/owner/orders'
import type { MockOrderLine, MockOrderStatus, MockOwnerOrder } from './mocks/ownerMockData'

export function trackingToUiStatus(tracking: OwnerTrackingStatus | undefined): MockOrderStatus {
  switch (tracking) {
    case 'RECEIVED':
      return 'new'
    case 'COOKING':
      return 'progress'
    case 'READY_FOR_PICKUP':
      return 'ready'
    case 'PICKED_UP':
    case 'REJECTED':
      return 'completed'
    default:
      return 'new'
  }
}

function isRejectedTracking(tracking: OwnerTrackingStatus | undefined): boolean {
  return tracking === 'REJECTED'
}

function uiLabel(status: MockOrderStatus, rejected?: boolean): string {
  if (rejected) return '거절'
  if (status === 'new') return '신규'
  if (status === 'progress') return '조리 중'
  if (status === 'ready') return '픽업 대기'
  return '완료'
}

function formatOrderedAt(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  if (diff < 60_000) return '방금 전'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}시간 전`
  return formatOrderedAt(iso)
}

/** 목록 DTO → POS 카드 모델 (거절도 완료로 포함) */
export function mapOwnerOrderSummary(dto: OwnerOrderSummaryDto): MockOwnerOrder {
  const rejected = isRejectedTracking(dto.trackingStatus)
  const ui = trackingToUiStatus(dto.trackingStatus)

  const nick = dto.customerNickname?.trim() || '손님'
  const qty = dto.totalQuantity ?? 0
  const summary = qty > 0 ? `${nick} · ${qty}개` : nick
  const amount = Number(dto.finalAmount) || 0

  const paidMs = dto.paidAt ? Date.parse(dto.paidAt) : Number.NaN
  const orderedMs = dto.orderedAt ? Date.parse(dto.orderedAt) : Number.NaN
  const anchorMs = Number.isFinite(paidMs)
    ? paidMs
    : Number.isFinite(orderedMs)
      ? orderedMs
      : undefined

  return {
    orderId: dto.orderId,
    orderNo: dto.orderNo || String(dto.orderId),
    label: uiLabel(ui, rejected),
    summary,
    amount,
    time: relativeTime(dto.orderedAt || dto.paidAt),
    status: ui,
    rejected,
    orderedAtLabel: formatOrderedAt(dto.orderedAt || dto.paidAt) || (rejected ? '거절됨' : '주문'),
    items: [{ name: summary, price: amount }],
    subtotal: amount,
    discount: 0,
    total: amount,
    paymentMethod: rejected ? '거절·환불' : dto.orderStatus || '결제',
    // Date.now()로 덮지 않음 — 수락 시점 앵커는 paidAt/이전값 유지
    acceptedAtMs:
      ui === 'progress' || ui === 'ready' || (ui === 'completed' && !rejected)
        ? anchorMs
        : undefined,
    readyAtMs: ui === 'ready' || (ui === 'completed' && !rejected) ? anchorMs : undefined,
    completedAtMs: ui === 'completed' ? anchorMs : undefined,
    estimatedPickupTime: dto.estimatedPickupTime ?? null,
  }
}

/** 상세로 카드 모델 보강 */
export function mapOwnerOrderDetail(dto: OwnerOrderDetailDto, prev?: MockOwnerOrder | null): MockOwnerOrder {
  const base = mapOwnerOrderSummary({
    orderId: dto.orderId,
    orderNo: dto.orderNo,
    customerNickname: dto.customerNickname || dto.customerName,
    orderStatus: dto.orderStatus,
    trackingStatus: dto.trackingStatus,
    finalAmount: dto.finalAmount,
    orderedAt: dto.orderedAt,
    paidAt: dto.paidAt,
    estimatedPickupTime: dto.estimatedPickupTime,
    totalQuantity: dto.items?.reduce((s, i) => s + (i.quantity || 0), 0),
  })

  const items: MockOrderLine[] = (dto.items ?? []).flatMap((item) => {
    const opts = (item.options ?? []).map((o) => o.optionName).filter(Boolean).join(', ')
    const line: MockOrderLine = {
      name: item.menuName,
      option: opts || undefined,
      price: item.itemTotalAmount ?? (item.menuPrice ?? 0) * (item.quantity || 1),
    }
    const rows = [line]
    if (item.requestMemo?.trim()) {
      rows.push({ name: `요청: ${item.requestMemo.trim()}`, price: 0 })
    }
    return rows
  })

  const discount =
    (dto.tierDiscountAmount ?? 0) + (dto.couponDiscountAmount ?? 0) + (dto.ecoDiscountAmount ?? 0)
  const noteParts = [
    dto.customerPhone ? `연락처 ${dto.customerPhone}` : null,
    dto.useMultiUseContainer ? '다회용기 사용' : null,
    base.rejected ? '매장에서 주문을 거절했습니다' : null,
  ].filter(Boolean)

  return {
    ...base,
    ...prev,
    orderId: dto.orderId,
    orderNo: dto.orderNo || base.orderNo,
    status: base.status,
    label: base.label,
    rejected: base.rejected,
    items: items.length ? items : base.items,
    customerNote: noteParts.length ? noteParts.join(' · ') : prev?.customerNote,
    subtotal: dto.originalAmount ?? base.subtotal,
    discount,
    total: dto.finalAmount ?? base.total,
    amount: dto.finalAmount ?? base.amount,
    estimatedPickupTime: dto.estimatedPickupTime ?? prev?.estimatedPickupTime ?? base.estimatedPickupTime,
    acceptedAtMs: base.acceptedAtMs ?? prev?.acceptedAtMs,
    readyAtMs: base.readyAtMs ?? prev?.readyAtMs,
    completedAtMs: base.completedAtMs ?? prev?.completedAtMs,
    summary:
      items.length > 0
        ? items
            .filter((i) => !i.name.startsWith('요청:'))
            .map((i) => i.name)
            .slice(0, 2)
            .join(' · ')
        : base.summary,
  }
}
