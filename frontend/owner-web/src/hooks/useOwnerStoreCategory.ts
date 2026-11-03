import { useCallback, useEffect, useState } from 'react'
import {
  getStoreCategoryLabel,
  isValidStoreCategoryId,
  persistStoreCategorySelection,
  type StoreCategoryId,
  type StoreCategorySelection,
} from '../lib/storeCategories'

const storageKey = (storeId: number) => `owner_store_category_${storeId}`

function readStored(storeId: number): StoreCategorySelection | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(storageKey(storeId))
    if (raw == null) return undefined
    if (raw === 'null') return null
    const id = Number(raw)
    if (!Number.isFinite(id) || !isValidStoreCategoryId(id)) return undefined
    return id as StoreCategorySelection
  } catch {
    return undefined
  }
}

/**
 * 매장 업종 카테고리 (한식·양식·기타 등).
 */
export function useOwnerStoreCategory(storeId: number, apiCategoryId?: number | null) {
  const [categoryId, setCategoryIdState] = useState<StoreCategorySelection>(() => {
    const stored = readStored(storeId)
    if (stored !== undefined) return stored
    if (apiCategoryId != null && isValidStoreCategoryId(apiCategoryId)) return apiCategoryId as StoreCategoryId
    return 1 as StoreCategoryId
  })

  useEffect(() => {
    const stored = readStored(storeId)
    if (stored !== undefined) {
      setCategoryIdState(stored)
      return
    }
    if (apiCategoryId != null && isValidStoreCategoryId(apiCategoryId)) {
      setCategoryIdState(apiCategoryId as StoreCategoryId)
    }
  }, [storeId, apiCategoryId])

  const setCategoryId = useCallback(
    (next: StoreCategorySelection) => {
      setCategoryIdState(next)
      persistStoreCategorySelection(storeId, next)
    },
    [storeId],
  )

  const categoryLabel = getStoreCategoryLabel(categoryId)

  return { categoryId, categoryLabel, setCategoryId }
}
