import { useCallback, useEffect, useState } from 'react'
import { fetchSortedStores, fetchStores } from '../api/store'
import type { FeaturedRestaurant } from '../constants'
import { categoryTabToApiParam } from '../constants'
import type { GeoCoords } from '../lib/geolocation'
import {
  mapSortedStoreToFeatured,
  mapStoreListItemToFeatured,
  restaurantMatchesCategoryTab,
} from '../lib/storeUi'

export type StoreSortOrder = 'default' | 'distance' | 'rating'

type UseStoreListParams = {
  activeTab: string
  sortOrder: StoreSortOrder
  coords: GeoCoords | null
  geoLoading: boolean
}

export function useStoreList({
  activeTab,
  sortOrder,
  coords,
  geoLoading,
}: UseStoreListParams) {
  const [restaurants, setRestaurants] = useState<FeaturedRestaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setHint(null)
    setError(null)
    const tabParam = categoryTabToApiParam(activeTab)

    if ((sortOrder === 'distance' || sortOrder === 'rating') && !coords) {
      setLoading(false)
      return
    }

    if (sortOrder === 'distance' || sortOrder === 'rating') {
      try {
        const list = await fetchSortedStores({
          sortBy: sortOrder === 'distance' ? 'DISTANCE' : 'RATING',
          latitude: coords!.latitude,
          longitude: coords!.longitude,
          ...tabParam,
        })
        setRestaurants(list.map(mapSortedStoreToFeatured))
        if (list.length === 0) {
          setHint('3km 이내에 해당하는 매장이 없습니다.')
        } else {
          setHint('현재 위치 기준 3km 이내 매장입니다.')
        }
      } catch {
        setRestaurants([])
        setError('주변 매장을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const list = await fetchStores(tabParam)
      setRestaurants(list.map(mapStoreListItemToFeatured))
      if (list.length === 0) {
        setHint('등록된 매장이 없습니다.')
      }
    } catch {
      setRestaurants([])
      setError('매장 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, sortOrder, coords])

  useEffect(() => {
    if ((sortOrder === 'distance' || sortOrder === 'rating') && geoLoading) {
      setLoading(true)
      return
    }
    void load()
  }, [load, sortOrder, geoLoading])

  const filtered = restaurants.filter((r) => restaurantMatchesCategoryTab(activeTab, r))

  return { restaurants: filtered, loading, hint, error, reload: load }
}

/** 홈 — 주변 3km (거리순) */
export function useNearbyRestaurants(coords: GeoCoords | null, geoLoading: boolean) {
  const [restaurants, setRestaurants] = useState<FeaturedRestaurant[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (geoLoading || !coords) return
    let cancelled = false
    setLoading(true)

    void fetchSortedStores({
      sortBy: 'DISTANCE',
      latitude: coords.latitude,
      longitude: coords.longitude,
    })
      .then((list) => {
        if (cancelled) return
        if (list.length > 0) {
          setRestaurants(list.map(mapSortedStoreToFeatured))
          setHint('내 주변 3km 이내 매장')
        } else {
          setRestaurants([])
          setHint('주변 3km 이내 매장이 없습니다.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurants([])
          setHint(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [coords, geoLoading])

  return { restaurants, loading, hint }
}
