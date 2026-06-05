import type { StoreDetailDto } from '../../api/store'
import type { ReviewDto } from '../../api/reviews'

export type MockOrderStatus = 'new' | 'progress' | 'ready' | 'completed'

export type MockOrderLine = {
  name: string
  option?: string
  price: number
}

export type MockOwnerOrder = {
  orderId: number
  orderNo: string
  label: string
  summary: string
  amount: number
  time: string
  status: MockOrderStatus
  orderedAtLabel: string
  items: MockOrderLine[]
  customerNote?: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  /** 기본 조리시간 대비 가감(분). 픽업 예상 = 매장 기본 + 이 값 */
  pickupAdjustMinutes?: number
  /** 조리 시작 시각(ms). 이후 픽업 시간 변경 불가 */
  acceptedAtMs?: number
}

export function getMockStoreDetail(storeId: number): StoreDetailDto {
  return {
    storeId,
    name: '줍줍 키친 강남점',
    categoryId: 1,
    address: '서울특별시 강남구 테헤란로 123',
    phoneNumber: '02-1234-5678',
    originInfo: '국내산 돼지고기, 국내산 쌀',
    cookingTimeMinutes: 15,
    minOrderAmount: 12000,
    menus: [
      {
        menuId: 101,
        name: '시그니처 불고기 비빔밥',
        price: 14000,
        description: '특제 소스 불고기와 제철 나물 7가지.',
        isSoldOut: false,
        rewardXp: 0,
      },
      {
        menuId: 102,
        name: '숙성 묵은지 김치찌개',
        price: 12000,
        description: '300일 숙성 묵은지와 국내산 돼지.',
        isSoldOut: true,
        rewardXp: 0,
      },
      {
        menuId: 103,
        name: '갈릭 허니 가라아게',
        price: 9500,
        description: '바삭한 닭다리살, 마늘 꿀 소스.',
        isSoldOut: false,
        rewardXp: 0,
      },
      {
        menuId: 104,
        name: '생딸기 리얼 에이드',
        price: 6500,
        description: '당일 공수 딸기 청 에이드.',
        isSoldOut: false,
        rewardXp: 0,
      },
      {
        menuId: 105,
        name: '트러플 크림 파스타',
        price: 16500,
        description: '트러플 오일과 파마산 치즈.',
        isSoldOut: false,
        rewardXp: 0,
      },
      {
        menuId: 106,
        name: '제육 덮밥',
        price: 11000,
        description: '매콤 제육과 양파, 상추.',
        isSoldOut: false,
        rewardXp: 0,
      },
    ],
  }
}

export const MOCK_OWNER_ORDERS: MockOwnerOrder[] = [
  {
    orderId: 8825,
    orderNo: '8825-02',
    label: '신규',
    summary: '제육 덮밥 · 생딸기 에이드',
    amount: 17500,
    time: '방금 전',
    status: 'new',
    orderedAtLabel: '오후 02:33 픽업 주문',
    items: [
      { name: '제육 덮밥', price: 11000 },
      { name: '생딸기 리얼 에이드', price: 6500 },
    ],
    customerNote: '에이드 얼음 적게 부탁해요.',
    subtotal: 17500,
    discount: 0,
    total: 17500,
    paymentMethod: '토스페이',
  },
  {
    orderId: 8824,
    orderNo: '8824-01',
    label: '신규',
    summary: '수비드 스테이크 외 2건',
    amount: 42500,
    time: '방금 전',
    status: 'new',
    orderedAtLabel: '오후 02:31 픽업 주문',
    items: [
      { name: '수비드 부채살 스테이크', option: '미디엄 레어, 가니쉬 추가', price: 34000 },
      { name: '시저 샐러드', option: '드레싱 따로', price: 8500 },
    ],
    customerNote: '문 앞에 두고 벨 눌러주세요. 스테이크 소스 넉넉히 부탁드립니다!',
    subtotal: 46000,
    discount: 3500,
    total: 42500,
    paymentMethod: '신용카드 (일시불)',
  },
  {
    orderId: 8823,
    orderNo: '8824-00',
    label: '진행 중',
    summary: '트러플 머쉬룸 리조또',
    amount: 28000,
    time: '5분 전',
    status: 'progress',
    orderedAtLabel: '오후 02:26 픽업 주문',
    items: [{ name: '트러플 머쉬룸 리조또', price: 28000 }],
    subtotal: 28000,
    discount: 0,
    total: 28000,
    paymentMethod: '카카오페이',
    pickupAdjustMinutes: 0,
    acceptedAtMs: Date.now() - 5 * 60_000,
  },
  {
    orderId: 8822,
    orderNo: '8823-99',
    label: '진행 중',
    summary: '시그니처 플래터',
    amount: 56000,
    time: '12분 전',
    status: 'progress',
    orderedAtLabel: '오후 02:19 픽업 주문',
    items: [
      { name: '시그니처 플래터', price: 48000 },
      { name: '하우스 와인 2잔', price: 8000 },
    ],
    subtotal: 56000,
    discount: 0,
    total: 56000,
    paymentMethod: '신용카드',
    pickupAdjustMinutes: 5,
    acceptedAtMs: Date.now() - 12 * 60_000,
  },
  {
    orderId: 8821,
    orderNo: '8823-98',
    label: '완료',
    summary: '불고기 비빔밥 2인',
    amount: 32000,
    time: '25분 전',
    status: 'completed',
    orderedAtLabel: '오후 02:13 픽업 완료',
    items: [{ name: '시그니처 불고기 비빔밥', option: '×2', price: 32000 }],
    subtotal: 32000,
    discount: 0,
    total: 32000,
    paymentMethod: '네이버페이',
  },
  {
    orderId: 8820,
    orderNo: '8823-97',
    label: '완료',
    summary: '갈릭 가라아게 세트',
    amount: 21000,
    time: '38분 전',
    status: 'completed',
    orderedAtLabel: '오후 02:00 픽업 완료',
    items: [
      { name: '갈릭 허니 가라아게', price: 9500 },
      { name: '시저 샐러드', price: 8500 },
      { name: '콜라', price: 3000 },
    ],
    subtotal: 21000,
    discount: 0,
    total: 21000,
    paymentMethod: '신용카드',
  },
]

export function getMockStoreReviews(storeId: number): ReviewDto[] {
  return [
    {
      reviewId: 1,
      orderId: 8801,
      memberProfileId: 12,
      storeId,
      overallRating: 5,
      content: '스테이크 샐러드 정말 맛있었어요! 고기가 부드럽고 야채도 신선했습니다.',
      createdAt: '2026-05-20T14:30:00',
    },
    {
      reviewId: 2,
      orderId: 8798,
      memberProfileId: 34,
      storeId,
      overallRating: 4,
      content: '픽업이 예상보다 빨라서 좋았어요. 포장도 깔끔했습니다.',
      createdAt: '2026-05-19T19:12:00',
    },
    {
      reviewId: 3,
      orderId: 8790,
      memberProfileId: 7,
      storeId,
      overallRating: 5,
      content: '비빔밥 양도 넉넉하고 양념이 딱 제 스타일이에요. 또 주문할게요!',
      createdAt: '2026-05-18T12:05:00',
    },
    {
      reviewId: 4,
      orderId: 8782,
      memberProfileId: 51,
      storeId,
      overallRating: 3,
      content: '맛은 좋은데 대기 시간이 조금 길었어요.',
      createdAt: '2026-05-17T18:40:00',
    },
  ]
}

export const MOCK_DASHBOARD = {
  todaySales: 2450000,
  salesTrendPct: 12.5,
  orderCount: 142,
  orderTrendPct: 8.2,
  pickupInProgress: 18,
}
