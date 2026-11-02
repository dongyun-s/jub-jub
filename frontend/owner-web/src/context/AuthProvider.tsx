import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { clearTokens } from '../lib/authStorage'
import { isOwnerAuthSkipped } from '../lib/ownerConfig'
import { clearActiveOwnerStore } from '../lib/ownerSession'
import { getOwnerAccessToken } from '../api/authClient'

type AuthContextValue = {
  isLoggedIn: boolean
  /** true면 토큰 없이 진입 (VITE_OWNER_SKIP_AUTH=true 만) */
  authSkipped: boolean
  /** 로그인 직후 토큰이 저장된 뒤 호출해 RequireAuth가 바로 통과하도록 함 */
  markLoggedIn: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authSkipped = isOwnerAuthSkipped()
  const [tokenPresent, setTokenPresent] = useState(() => Boolean(getOwnerAccessToken()))
  const isLoggedIn = authSkipped || tokenPresent

  const markLoggedIn = useCallback(() => {
    setTokenPresent(Boolean(getOwnerAccessToken()))
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    clearActiveOwnerStore()
    setTokenPresent(false)
  }, [])

  const value = useMemo(
    () => ({ isLoggedIn, authSkipped, markLoggedIn, logout }),
    [isLoggedIn, authSkipped, markLoggedIn, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** 미로그인 시 /auth/login (SKIP_AUTH=true 일 때만 통과) */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authSkipped } = useAuth()
  const location = useLocation()

  if (authSkipped) {
    return <>{children}</>
  }

  if (!isLoggedIn) {
    const fromPath = location.pathname.startsWith('/auth') ? '/dashboard' : location.pathname
    return <Navigate to="/auth/login" replace state={{ from: fromPath }} />
  }

  return <>{children}</>
}
