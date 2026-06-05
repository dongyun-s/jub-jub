import { createContext, useContext, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { clearTokens } from '../lib/authStorage'
import { getOwnerAccessToken } from '../api/authClient'

type AuthContextValue = {
  isLoggedIn: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Api 요청에서 쓰는 토큰 소스(getOwnerAccessToken)와 동일하게 판정
  const isLoggedIn = Boolean(getOwnerAccessToken())

  const logout = () => {
    clearTokens()
  }

  const value = useMemo(() => ({ isLoggedIn, logout }), [isLoggedIn])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * owner-web의 기능 페이지를 토큰 기반으로 보호합니다.
 * - 미로그인: `/auth/login`으로 이동
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, logout } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // (선택) 토큰이 깨졌을 가능성이 있으면 localStorage 정리
    logout()
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

