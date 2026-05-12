/**
 * LoginPage.tsx
 * 로그인 — POST /api/v1/auth/login
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { login } from '../../api/auth'
import { ApiError } from '../../api/authClient'
import { setSessionEmail, setTokens } from '../../lib/authStorage'
import { migrateWeeklyAnonAttendanceToEmail } from '../../lib/rewardAttendance'

interface LoginPageProps {
  onLogin: () => void
  onSignUp: () => void
  onForgotId: () => void
  onForgotPassword: () => void
}

function LoginPage({ onLogin, onSignUp, onForgotId, onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      setTokens(res.accessToken, res.refreshToken)
      const loggedEmail = res.email?.trim() || email.trim()
      setSessionEmail(loggedEmail)
      migrateWeeklyAnonAttendanceToEmail(loggedEmail)
      onLogin()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <header className="page-header justify-center">
        <span className="page-header-title">Jub-Jub</span>
      </header>

      <main className="page-content">
        <div className="flex justify-center pt-4 pb-6">
          <img src="/logo.png" alt="JUB-JUB" className="h-40 w-auto" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-title leading-tight">Jub-Jub 에 오신 것을 환영합니다!</h1>
          <p className="text-subtitle mt-2">맛있는 탐험을 위해 지금 바로 합류하세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input-field"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="input-label">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="input-field pr-12"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <span className="material-symbols-outlined text-xl text-gray-400">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onForgotId} className="btn-text">
              아이디 찾기
            </button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={onForgotPassword} className="btn-text">
              비밀번호 찾기
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-center text-subtitle">
          계정이 없으신가요?{' '}
          <button type="button" onClick={onSignUp} className="text-link">
            회원가입
          </button>
        </p>
      </main>

      <SimpleAlertModal
        open={Boolean(error)}
        title="로그인 실패"
        message={error ?? ''}
        onClose={() => setError(null)}
      />
    </Layout>
  )
}

export default LoginPage
