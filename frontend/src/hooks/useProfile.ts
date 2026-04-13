/**
 * 로그인 시 GET /api/v1/auth/me 로 프로필 조회
 */

import { useCallback, useEffect, useState } from 'react'
import { getMe, type ProfileMe } from '../api/auth'
import { getAccessToken } from '../lib/authStorage'

export function useProfile() {
  const [profile, setProfile] = useState<ProfileMe | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!getAccessToken()) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getMe()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { profile, loading, refetch: load }
}
