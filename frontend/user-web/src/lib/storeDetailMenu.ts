import type { MenuDto } from '../api/store'
import { resolveMenuImageUrl } from './menuImage'

export interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
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
    image: resolveMenuImageUrl(m.imageUrl),
    tags,
    isSoldOut: m.isSoldOut,
  }
}

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
    tags: it.isSoldOut
      ? []
      : i === 0
        ? (['best', 'loot'] as ('best' | 'loot')[])
        : (['best'] as ('best' | 'loot')[]),
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
