import { createContext, useContext, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { clearTokens } from '../lib/authStorage'
import { isOwnerAuthSkipped } from '../lib/ownerConfig'
import { clearActiveOwnerStore } from '../lib/ownerSession'
import { getOwnerAccessToken } from '../api/authClient'

type AuthContextValue = {
  isLoggedIn: boolean
  /** true면 토큰 없이 진입 (VITE_OWNER_SKIP_AUTH=true 만) */
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
