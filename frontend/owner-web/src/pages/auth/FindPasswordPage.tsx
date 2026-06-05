import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError } from '../../api/authClient'
import { findPasswordSend, resetPassword, verifyConfirm } from '../../api/auth'
import styles from './AuthPage.module.css'

type Step = 'email' | 'code' | 'newPassword' | 'done'

export function FindPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [logId, setLogId] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const id = await findPasswordSend(email.trim())
      setLogId(id)
      setStep('code')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (logId == null) return
    setError(null)
    setLoading(true)
    try {
      const res = await verifyConfirm(logId, code.trim())
      if (res.isVerified) setStep('newPassword')
      else setError('인증번호가 올바르지 않습니다.')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '인증 확인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (logId == null) return
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await resetPassword(email.trim(), logId, newPassword)
      setStep('done')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.'
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
              <p className={styles.brandSub}>비밀번호 찾기</p>
            </div>
          </div>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/auth/login')}>
            <Icon name="arrow_back" style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        <h1 className={styles.title}>비밀번호를 잊으셨나요?</h1>
        <p className={styles.subtitle}>
          {step === 'email' && '이메일로 재설정 인증번호를 보냅니다.'}
          {step === 'code' && '메일(또는 안내)에 온 인증번호를 입력하세요.'}
          {step === 'newPassword' && '새 비밀번호를 설정하세요.'}
          {step === 'done' && '비밀번호가 변경되었습니다. 로그인해 주세요.'}
        </p>

        {step === 'email' && (
          <form className={styles.form} onSubmit={handleSend}>
            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="email">
                이메일(아이디)
              </label>
              <input
                id="email"
                type="email"
                className="owner-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@jubjub.com"
                required
              />
            </div>
            <button type="submit" className="owner-btn-primary" disabled={loading}>
              {loading ? '인증 중…' : '인증번호 발송'}
            </button>
            <div className={styles.btnLinkRow}>
              <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/login')}>
                로그인으로
              </button>
              <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/find-id')}>
                아이디 찾기
              </button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form className={styles.form} onSubmit={handleConfirmCode}>
            <p className={styles.smallNote}>
              요청 이메일: <strong>{email}</strong>
            </p>
            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="code">
                인증번호 6자리
              </label>
              <input
                id="code"
                type="text"
                className="owner-input-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6자리"
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
            <button type="submit" className="owner-btn-primary" disabled={loading}>
              {loading ? '확인 중…' : '인증 확인'}
            </button>
          </form>
        )}

        {step === 'newPassword' && (
          <form className={styles.form} onSubmit={handleReset}>
            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="pw1">
                새 비밀번호
              </label>
              <input
                id="pw1"
                type="password"
                className="owner-input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="pw2">
                새 비밀번호 확인
              </label>
              <input
                id="pw2"
                type="password"
                className="owner-input-field"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="owner-btn-primary" disabled={loading}>
              {loading ? '처리 중…' : '비밀번호 변경'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className={styles.form}>
            <div className={styles.mutedBox}>
              <p style={{ margin: 0, fontWeight: 900 }}>비밀번호가 변경되었습니다.</p>
              <p style={{ margin: '0.5rem 0 0' }}>이제 로그인해 주세요.</p>
            </div>
            <button type="button" className="owner-btn-primary" onClick={() => navigate('/auth/login')}>
              로그인하러 가기
            </button>
          </div>
        )}
      </div>

      <SimpleAlertModal open={Boolean(error)} title="비밀번호 찾기" message={error ?? ''} onClose={() => setError(null)} />
    </div>
  )
}

