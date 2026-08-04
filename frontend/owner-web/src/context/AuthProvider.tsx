import { createContext, useContext, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { clearTokens } from '../lib/authStorage'
import { isOwnerAuthSkipped } from '../lib/ownerConfig'
import { clearActiveOwnerStore } from '../lib/ownerSession'
import { getOwnerAccessToken } from '../api/authClient'

type AuthContextValue = {
  isLoggedIn: boolean
  /** auth 연동 전: 로그인 없이 진입 중 */
  authSkipped: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authSkipped = isOwnerAuthSkipped()
  const isLoggedIn = authSkipped || Boolean(getOwnerAccessToken())

  const logout = () => {
    clearTokens()
    clearActiveOwnerStore()
  }

  const value = useMemo(() => ({ isLoggedIn, authSkipped, logout }), [isLoggedIn, authSkipped])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * owner-web 기능 페이지 보호
 * - VITE_OWNER_SKIP_AUTH 기본(스킵): 토큰 없이 통과
 * - false: 미로그인 시 /auth/login
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authSkipped, logout } = useAuth()
  const location = useLocation()

  if (authSkipped) {
    return <>{children}</>
  }

  if (!isLoggedIn) {
    logout()
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
