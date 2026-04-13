/**
 * FindPasswordPage.tsx
 * 비밀번호 찾기 — find-password/send, verify/confirm, reset-password
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { findPasswordSend, resetPassword, verifyConfirm } from '../../api/auth'
import { ApiError } from '../../api/authClient'

interface FindPasswordPageProps {
  onBack: () => void
  onGoToFindId: () => void
}

type Step = 'email' | 'code' | 'newPassword' | 'done'

function FindPasswordPage({ onBack, onGoToFindId }: FindPasswordPageProps) {
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
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '인증번호 발송에 실패했습니다.',
      )
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
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '인증 확인에 실패했습니다.',
      )
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
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '비밀번호 재설정에 실패했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <header className="page-header">
        <button type="button" className="btn-icon" onClick={onBack}>
          <span className="material-symbols-outlined text-gray-800">arrow_back</span>
        </button>
        <span className="page-header-title">비밀번호 찾기</span>
        <div className="w-10" />
      </header>

      <main className="page-content">
        <div className="flex justify-center py-6">
          <img src="/logo.png" alt="JUB-JUB" className="h-24 w-auto" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-gray-900">비밀번호를 잊으셨나요?</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            {step === 'email' && '이메일로 재설정 인증번호를 보냅니다.'}
            {step === 'code' && '메일(또는 안내)에 온 인증번호를 입력하세요.'}
            {step === 'newPassword' && '새 비밀번호를 설정하세요.'}
            {step === 'done' && '비밀번호가 변경되었습니다. 로그인해 주세요.'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="input-label">이메일(아이디)</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@jubjub.com"
                  className="input-field pr-12"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-xl text-primary">mail</span>
                </span>
              </div>
            </div>
            <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>
              인증번호 발송
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <p className="text-sm text-gray-600">
              요청 이메일: <strong>{email}</strong>
            </p>
            <div>
              <label className="input-label">인증번호 6자리</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '확인 중…' : '인증 확인'}
            </button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="input-label">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">새 비밀번호 확인</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '처리 중…' : '비밀번호 변경'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <button type="button" className="btn-primary w-full" onClick={onBack}>
            로그인으로
          </button>
        )}

        {step !== 'done' && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <button type="button" onClick={onBack} className="text-gray-500">
              로그인으로 돌아가기
            </button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={onGoToFindId} className="font-medium text-primary">
              아이디 찾기
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          도움이 필요하신가요?{' '}
          <button type="button" className="text-primary underline">
            고객센터 문의
          </button>
        </p>
      </main>

      <SimpleAlertModal
        open={Boolean(error)}
        title="비밀번호 찾기"
        message={error ?? ''}
        onClose={() => setError(null)}
      />
    </Layout>
  )
}

export default FindPasswordPage
