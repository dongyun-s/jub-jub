/**
 * 매장 상세 API 메뉴 → StoreDetailPage 메뉴 카테고리 UI 모델
 */
import type { MenuDto } from '../api/store'

export interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  xp?: number
  image?: string
  tags: ('best' | 'loot')[]
  rank?: number
  isSoldOut?: boolean
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  items: MenuItem[]
}

const MENU_IMAGES = [
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop',
]

function dtoToMenuItem(m: MenuDto, idx: number): MenuItem {
  const tags: ('best' | 'loot')[] = []
  if (!m.isSoldOut) {
    if (idx === 0) tags.push('best')
    if (idx === 1) tags.push('loot')
  }
  return {
    id: Number(m.menuId),
    name: m.name,
    description: m.description || undefined,
    price: m.price,
    xp: m.rewardXp,
    image: MENU_IMAGES[idx % MENU_IMAGES.length],
    tags,
    isSoldOut: m.isSoldOut,
  }
}

/** API 메뉴 목록이 비어 있지 않을 때 카테고리 트리 생성 */
export function buildMenuCategoriesFromApi(menus: MenuDto[]): MenuCategory[] {
  if (menus.length === 0) return []

  const items = menus.map(dtoToMenuItem)

  if (items.length <= 3) {
    return [
      {
        id: 'all',
        name: '전체 메뉴',
        description: '이 매장의 모든 메뉴입니다.',
        items: items.map((it) => ({ ...it, rank: undefined, tags: it.isSoldOut ? [] : it.tags })),
      },
    ]
  }

  const popularItems = items.slice(0, 2).map((it, i) => ({
    ...it,
    rank: (i + 1) as number,
    tags: it.isSoldOut ? [] : i === 0 ? (['best', 'loot'] as ('best' | 'loot')[]) : (['best'] as ('best' | 'loot')[]),
  }))

  const rest = items.slice(2).map((it) => ({
    ...it,
    rank: undefined,
    tags: it.isSoldOut ? [] : it.tags.filter((t) => t === 'loot'),
  }))

  return [
    {
      id: 'popular',
      name: '인기 메뉴',
      description: '주문이 많은 메뉴예요.',
      items: popularItems,
    },
    {
      id: 'main',
      name: '메뉴',
      items: rest,
    },
  ]
}

/** API 실패·로딩 전 폴백용 데모 메뉴 */
export const demoMenuCategories: MenuCategory[] = [
  {
    id: 'popular',
    name: '인기 메뉴',
    description: '한 달간 주문수가 많고 만족도가 높은 메뉴에요.',
    items: [
      {
        id: 1,
        name: '프리미엄 줍줍 보울',
        description: '신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴',
        price: 14900,
        xp: 50,
        image:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
        tags: ['best', 'loot'],
        rank: 1,
      },
      {
        id: 2,
        name: '아보카도 가든 샐러드',
        description: '숲의 버터 아보카도와 유기농 채소의 환상적인 만남',
        price: 12500,
        xp: 30,
        image:
          'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop',
        tags: ['best'],
        rank: 2,
      },
    ],
  },
  {
    id: 'main',
    name: '메인 메뉴',
    items: [
      {
        id: 3,
        name: '그릴드 치킨 스테이크',
        description: '부드러운 닭가슴살을 그릴에 구워 특제 소스와 함께',
        price: 15900,
        xp: 40,
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop',
        tags: [],
      },
    ],
  },
]
