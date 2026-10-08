import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError, getOwnerAccessToken } from '../../api/authClient'
import { isOwnerRole, login } from '../../api/auth'
import { setSessionEmail, setSessionRole, setTokens } from '../../lib/authStorage'
import { useOwnerMockData } from '../../lib/ownerConfig'
import {
  activateOwnerStoreForEmail,
  hasMockOwnerCredential,
  saveOwnerStoreProfile,
  getOwnerStoreProfile,
  verifyMockOwnerCredential,
  setActiveStoreId,
} from '../../lib/ownerSession'
import styles from './AuthPage.module.css'

type LocationState = { from?: string }

function resolvePostLoginPath(from: string | undefined): string {
  if (!from || from.startsWith('/auth')) return '/dashboard'
  return from
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = useMemo(
    () => resolvePostLoginPath((location.state as LocationState | null)?.from),
    [location.state],
  )
  const mockMode = useOwnerMockData()
  const alreadyLoggedIn = Boolean(getOwnerAccessToken())

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goAfterLogin = () => {
    navigate(from, { replace: true })
  }

  // 이미 로그인된 경우: effect navigate 루프 방지 → Navigate 한 번만
  if (alreadyLoggedIn) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const trimmedEmail = email.trim()
    try {
      // 예시 모드에서 로컬 가입한 계정만 API 없이 로그인
      if (mockMode && hasMockOwnerCredential(trimmedEmail)) {
        if (!verifyMockOwnerCredential(trimmedEmail, password)) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
          return
        }
        setTokens('mock-owner-access', 'mock-owner-refresh')
        setSessionEmail(trimmedEmail)
        setSessionRole('OWNER')
        activateOwnerStoreForEmail(trimmedEmail)
        goAfterLogin()
        return
      }

      const res = await login(trimmedEmail, password)
      if (!isOwnerRole(res.role)) {
        setError('사장님(OWNER) 계정이 아닙니다. 사장님 회원가입 후 로그인해 주세요.')
        return
      }

      const sessionEmail = res.email?.trim() || trimmedEmail
      setTokens(res.accessToken, res.refreshToken)
      setSessionEmail(sessionEmail)
      setSessionRole(String(res.role).trim())

      const storeId = res.storeId != null ? Number(res.storeId) : NaN
      if (Number.isFinite(storeId) && storeId > 0) {
        const existing = getOwnerStoreProfile(sessionEmail)
        saveOwnerStoreProfile({
          email: sessionEmail,
          businessNumber: existing?.businessNumber ?? '',
          storeAddress: existing?.storeAddress ?? '',
          storePhone: existing?.storePhone ?? '',
          storeName: existing?.storeName,
          storeId: Math.floor(storeId),
        })
        setActiveStoreId(Math.floor(storeId))
      } else {
        activateOwnerStoreForEmail(sessionEmail)
      }

      goAfterLogin()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandLeft}>
            <img src="/logo.png" alt="JubJub" className={styles.brandLogo} />
            <div>
              <p className={styles.brandTitle}>줍줍 사장님</p>
              <p className={styles.brandSub}>로그인</p>
            </div>
          </div>
        </div>

        <h1 className={styles.title}>환영합니다</h1>
        <p className={styles.subtitle}>주문과 메뉴를 관리하려면 로그인이 필요합니다.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="owner-input-field"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="password">
              비밀번호
            </label>
            <div className={styles.pwRow}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="owner-input-field"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className={styles.pwToggle} onClick={() => setShowPassword((p) => !p)} aria-label="비밀번호 보기">
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} style={{ fontSize: '1.1rem' }} />
              </button>
            </div>
          </div>

          <button type="submit" className="owner-btn-primary" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>

          <div className={styles.btnLinkRow}>
            <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/find-id')}>
              아이디 찾기
            </button>
            <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/find-password')}>
              비밀번호 찾기
            </button>
          </div>

          <div className={styles.divider} />

          <p className={styles.smallNote}>
            계정이 없으신가요?{' '}
            <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/signup')}>
              회원가입
            </button>
          </p>
        </form>
      </div>

      <SimpleAlertModal
        open={Boolean(error)}
        title="로그인 실패"
        message={error ?? ''}
        onClose={() => setError(null)}
      />
    </div>
  )
}
