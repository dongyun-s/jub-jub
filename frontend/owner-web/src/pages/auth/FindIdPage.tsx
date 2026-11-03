import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError } from '../../api/authClient'
import { findId } from '../../api/auth'
import styles from './AuthPage.module.css'

export function FindIdPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const masked = await findId(name.trim(), phone.trim())
      setResult(masked)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '아이디 찾기에 실패했습니다.'
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
              <p className={styles.brandSub}>아이디 찾기</p>
            </div>
          </div>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/auth/login')}>
            <Icon name="arrow_back" style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        <h1 className={styles.title}>아이디를 잊으셨나요?</h1>
        <p className={styles.subtitle}>가입 시 등록한 이름과 휴대폰 번호로 조회합니다.</p>

        {result ? (
          <div className={styles.mutedBox}>
            <p style={{ margin: 0, fontWeight: 900, color: 'var(--owner-on-surface)' }}>가입된 이메일(마스킹)</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--owner-primary-container)' }}>
              {result}
            </p>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="name">
              이름
            </label>
            <input
              id="name"
              className="owner-input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성함을 입력해주세요"
              required
            />
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="phone">
              휴대폰 번호
            </label>
            <input
              id="phone"
              type="tel"
              className="owner-input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="전화번호를 입력해 주세요"
              required
            />
          </div>

          <button type="submit" className="owner-btn-primary" disabled={loading}>
            {loading ? '조회 중…' : '아이디 찾기'}
          </button>

          <div className={styles.btnLinkRow}>
            <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/login')}>
              로그인으로 돌아가기
            </button>
            <button type="button" className={styles.linkBtn} onClick={() => navigate('/auth/find-password')}>
              비밀번호 찾기
            </button>
          </div>
        </form>
      </div>

      <SimpleAlertModal open={Boolean(error)} title="아이디 찾기" message={error ?? ''} onClose={() => setError(null)} />
    </div>
  )
}

