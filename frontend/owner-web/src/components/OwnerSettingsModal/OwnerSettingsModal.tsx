import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppModal from '../AppModal/AppModal'
import mc from '../AppModal/modalContent.module.css'
import { ApiError } from '../../api/authClient'
import { deleteMyAccount } from '../../api/users'
import { useAuth } from '../../context/AuthProvider'
import { clearActiveOwnerStore } from '../../lib/ownerSession'
import styles from './OwnerSettingsModal.module.css'

type OwnerSettingsModalProps = {
  open: boolean
  onClose: () => void
}

export function OwnerSettingsModal({ open, onClose }: OwnerSettingsModalProps) {
  const titleId = useId()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneOpen, setDoneOpen] = useState(false)

  const handleClose = () => {
    if (loading) return
    setPassword('')
    setError(null)
    onClose()
  }

  const handleWithdraw = async () => {
    const pw = password.trim()
    if (!pw) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    if (!window.confirm('정말 탈퇴하시겠어요?\n계정·매장 연동이 비활성화되고 로그아웃됩니다.')) return

    setLoading(true)
    setError(null)
    try {
      await deleteMyAccount(pw)
      setDoneOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '탈퇴를 처리하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const finishAfterWithdraw = () => {
    setDoneOpen(false)
    setPassword('')
    logout()
    clearActiveOwnerStore()
    onClose()
    navigate('/auth/login', { replace: true })
  }

  return (
    <>
      <AppModal open={open && !doneOpen} onClose={handleClose} size="md" aria-labelledby={titleId}>
        <h2 id={titleId} className={mc.titleLeft}>
          설정
        </h2>
        <p className={styles.lead}>계정·보안 관련 설정을 관리합니다.</p>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>회원 탈퇴</h3>
          <p className={styles.sectionDesc}>
            비밀번호 확인 후 계정이 비활성화됩니다. 탈퇴 후에는 다시 로그인할 수 없습니다.
          </p>
          <label className={styles.label} htmlFor="owner-withdraw-pw">
            비밀번호 확인
          </label>
          <input
            id="owner-withdraw-pw"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="현재 비밀번호"
            disabled={loading}
            autoComplete="current-password"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="button" className={styles.dangerBtn} disabled={loading} onClick={() => void handleWithdraw()}>
            {loading ? '탈퇴 처리 중…' : '탈퇴하기'}
          </button>
        </section>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} disabled={loading} onClick={handleClose}>
            닫기
          </button>
        </div>
      </AppModal>

      <AppModal open={doneOpen} onClose={finishAfterWithdraw} size="sm" role="alertdialog">
        <h2 className={mc.titleCenter}>탈퇴 완료</h2>
        <p className={mc.messageCenter}>이용해 주셔서 감사합니다. 로그인 화면으로 이동합니다.</p>
        <button type="button" className={`owner-btn-primary ${styles.doneBtn}`} onClick={finishAfterWithdraw}>
          확인
        </button>
      </AppModal>
    </>
  )
}
