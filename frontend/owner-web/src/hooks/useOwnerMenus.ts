import { useCallback, useEffect, useState } from 'react'
import {
  createOwnerMenu,
  deleteOwnerMenu,
  fetchOwnerMenus,
  setOwnerMenuSoldOut,
  updateOwnerMenu,
  type OwnerMenuListItem,
  type OwnerMenuWriteBody,
} from '../api/owner/menu'
import { ApiError } from '../api/authClient'
import { useOwnerMockData } from '../lib/ownerConfig'
import { getMockOwnerMenus } from '../lib/mocks/ownerMockData'

export function useOwnerMenus() {
  const mockMode = useOwnerMockData()
  const [menus, setMenus] = useState<OwnerMenuListItem[]>(mockMode ? getMockOwnerMenus() : [])
  const [loading, setLoading] = useState(!mockMode)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    if (mockMode) {
      setMenus(getMockOwnerMenus())
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setMenus(await fetchOwnerMenus())
    } catch (e: unknown) {
      setMenus([])
      setError(e instanceof ApiError ? e.message : '메뉴를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [mockMode])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (mockMode) {
        if (!cancelled) {
          setMenus(getMockOwnerMenus())
          setLoading(false)
          setError(null)
        }
        return
      }
      setLoading(true)
      try {
        const list = await fetchOwnerMenus()
        if (!cancelled) {
          setMenus(list)
          setError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setMenus([])
          setError(e instanceof ApiError ? e.message : '메뉴를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mockMode])

  const createMenu = useCallback(
    async (body: OwnerMenuWriteBody) => {
      if (mockMode) {
        const next: OwnerMenuListItem = {
          menuId: Date.now(),
          name: body.name.trim(),
          description: body.description.trim(),
          price: body.price,
          category: body.category,
          imageUrl: body.imageUrl?.trim() || null,
          isSpicy: body.isSpicy,
          isVegetarian: body.isVegetarian,
          isBest: body.isBest,
          soldOut: false,
        }
        setMenus((prev) => [next, ...prev])
        return { menuId: next.menuId, message: '메뉴가 등록되었습니다. (예시)' }
      }
      const result = await createOwnerMenu(body)
      await reload()
      return result
    },
    [mockMode, reload],
  )

  const updateMenu = useCallback(
    async (menuId: number, body: OwnerMenuWriteBody) => {
      if (mockMode) {
        setMenus((prev) =>
          prev.map((m) =>
            m.menuId === menuId
              ? {
                  ...m,
                  name: body.name.trim(),
                  description: body.description.trim(),
                  price: body.price,
                  category: body.category,
                  imageUrl:
                    body.imageUrl === undefined ? m.imageUrl : body.imageUrl?.trim() || null,
                  isSpicy: body.isSpicy,
                  isVegetarian: body.isVegetarian,
                  isBest: body.isBest,
                }
              : m,
          ),
        )
        return { menuId, message: '메뉴가 수정되었습니다. (예시)' }
      }
      setBusyId(menuId)
      try {
        const result = await updateOwnerMenu(menuId, body)
        await reload()
        return result
      } finally {
        setBusyId(null)
      }
    },
    [mockMode, reload],
  )

  const removeMenu = useCallback(
    async (menuId: number) => {
      if (mockMode) {
        setMenus((prev) => prev.filter((m) => m.menuId !== menuId))
        return '메뉴가 삭제되었습니다. (예시)'
      }
      setBusyId(menuId)
      try {
        const msg = await deleteOwnerMenu(menuId)
        await reload()
        return msg
      } finally {
        setBusyId(null)
      }
    },
    [mockMode, reload],
  )

  const toggleSoldOut = useCallback(
    async (menuId: number, soldOut: boolean) => {
      if (mockMode) {
        setMenus((prev) => prev.map((m) => (m.menuId === menuId ? { ...m, soldOut } : m)))
        return {
          menuId,
          message: soldOut ? '메뉴가 품절 처리되었습니다. (예시)' : '메뉴 판매가 재개되었습니다. (예시)',
        }
      }
      setBusyId(menuId)
      setMenus((prev) => prev.map((m) => (m.menuId === menuId ? { ...m, soldOut } : m)))
      try {
        return await setOwnerMenuSoldOut(menuId, soldOut)
      } catch (e) {
        setMenus((prev) => prev.map((m) => (m.menuId === menuId ? { ...m, soldOut: !soldOut } : m)))
        throw e
      } finally {
        setBusyId(null)
      }
    },
    [mockMode],
  )

  return {
    menus,
    loading,
    error,
    mockMode,
    busyId,
    reload,
    createMenu,
    updateMenu,
    removeMenu,
    toggleSoldOut,
  }
}
