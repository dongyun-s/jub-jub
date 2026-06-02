/**
 * SignUpPage.tsx
 * 회원가입 — /api/v1/auth/verify/*, /signup
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import {
  signup,
  verifyConfirm,
  verifySend,
  type VerificationType,
} from '../../api/auth'
import { ApiError } from '../../api/authClient'

interface SignUpPageProps {
  onSignUp: () => void
  onBack: () => void
}

function SignUpPage({ onSignUp, onBack }: SignUpPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const [verifyChannel, setVerifyChannel] = useState<VerificationType>('SMS')
  const [logId, setLogId] = useState<number | null>(null)
  const [verified, setVerified] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)

  const targetForSend = verifyChannel === 'EMAIL' ? email.trim() : phone.trim()

  const sendConfirmMessage =
    verifyChannel === 'EMAIL'
      ? `${targetForSend}로 인증 메일을 발송할까요?\n메일함·스팸함을 확인해 주세요.`
      : `${targetForSend}로 인증 문자를 발송할까요?`

  const requestSendCode = () => {
    setError(null)
    setInfo(null)
    if (verifyChannel === 'EMAIL') {
      if (!email.trim()) {
        setError('이메일을 입력해 주세요.')
        return
      }
    } else if (!phone.trim()) {
      setError('휴대폰 번호를 입력해 주세요.')
      return
    }
    setSendConfirmOpen(true)
  }

  const handleSendCode = async () => {
    setLoading(true)
    try {
      const res = await verifySend(verifyChannel, targetForSend)
      setLogId(res.logId)
      setVerified(false)
      if (verifyChannel === 'EMAIL') {
        setInfo(
          `입력하신 이메일로 인증번호를 보냈습니다. 메일함·스팸함을 확인해 주세요. (만료: ${res.expiresAt})`,
        )
      } else {
        setInfo(`문자(SMS)로 인증번호를 보냈습니다. (만료: ${res.expiresAt})`)
      }
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

  const handleVerifyCode = async () => {
    setError(null)
    setInfo(null)
    if (logId == null) {
      setError('먼저 인증번호를 발송해 주세요.')
      return
    }
    if (!verifyCode.trim()) {
      setError('인증번호를 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await verifyConfirm(logId, verifyCode.trim())
      if (res.isVerified) {
        setVerified(true)
        setInfo(
          verifyChannel === 'EMAIL'
            ? '이메일 인증이 완료되었습니다. 아래 정보를 확인한 뒤 가입을 완료하세요.'
            : '휴대폰 인증이 완료되었습니다. 아래 정보를 확인한 뒤 가입을 완료하세요.',
        )
      } else {
        setError(
          verifyChannel === 'EMAIL'
            ? '이메일로 받은 인증번호가 올바르지 않습니다.'
            : '문자로 받은 인증번호가 올바르지 않습니다.',
        )
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!verified) {
      setError(
        verifyChannel === 'EMAIL'
          ? '이메일 인증을 완료해 주세요.'
          : '휴대폰(SMS) 인증을 완료해 주세요.',
      )
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await signup({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        nickname: nickname.trim() || name.trim(),
      })
      onSignUp()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '회원가입에 실패했습니다.',
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
        <span className="page-header-title">회원가입</span>
        <div className="w-10" />
      </header>

      <main className="page-content">
        <div className="flex justify-center py-4">
          <img src="/logo.png" alt="JUB-JUB" className="h-24 w-auto" />
        </div>

        <p className="mb-4 text-center text-xs text-gray-500">
          {verifyChannel === 'EMAIL'
            ? '① 인증 메일 발송 → ② 메일의 인증번호 입력 → ③ 나머지 정보 입력 후 가입'
            : '① 인증 문자 발송 → ② 문자의 인증번호 입력 → ③ 나머지 정보 입력 후 가입'}
        </p>
        {info && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-full border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => {
                setVerifyChannel('SMS')
                setLogId(null)
                setVerified(false)
                setVerifyCode('')
              }}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                verifyChannel === 'SMS' ? 'bg-primary/10 text-primary' : 'text-gray-500'
              }`}
            >
              SMS 인증
            </button>
            <button
              type="button"
              onClick={() => {
                setVerifyChannel('EMAIL')
                setLogId(null)
                setVerified(false)
                setVerifyCode('')
              }}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                verifyChannel === 'EMAIL' ? 'bg-primary/10 text-primary' : 'text-gray-500'
              }`}
            >
              이메일 인증
            </button>
          </div>

          <div>
            <label className="input-label">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성함을 입력하세요"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="앱에서 표시될 닉네임"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="input-field"
              required
            />
          </div>

          {verifyChannel === 'EMAIL' ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-800">이메일 인증</p>
              <p className="text-xs leading-relaxed text-gray-600">
                위에 입력한 이메일로 인증번호가 발송됩니다. 메일 제목·발신자를 확인하고, 도착하지 않으면 스팸함을
                살펴보세요.
              </p>
              <button
                type="button"
                onClick={requestSendCode}
                disabled={loading}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white"
              >
                인증 메일 발송
              </button>
              <div>
                <label className="input-label">이메일 인증번호</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="메일 본문의 6자리"
                    className="input-field flex-1"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading}
                    className="rounded-full bg-primary px-5 text-sm font-medium text-white"
                  >
                    확인
                  </button>
                </div>
                {verified && (
                  <p className="mt-1 text-xs text-emerald-600">✓ 이메일 인증 완료</p>
                )}
              </div>
            </div>
          ) : null}

          {verifyChannel === 'SMS' ? (
            <>
              <div>
                <label className="input-label">휴대폰 번호</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="전화번호를 입력해 주세요"
                  className="input-field"
                  required
                />
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">휴대폰(SMS) 인증</p>
                <p className="text-xs leading-relaxed text-gray-600">
                  위에 입력한 번호로만 인증 문자가 발송됩니다. 수신이 안 되면 번호·차단 설정을 확인해 주세요.
                </p>
                <button
                  type="button"
                  onClick={requestSendCode}
                  disabled={loading}
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white"
                >
                  인증 문자 발송
                </button>
                <div>
                  <label className="input-label">SMS 인증번호</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="문자 메시지의 6자리"
                      className="input-field flex-1"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={loading}
                      className="rounded-full bg-primary px-5 text-sm font-medium text-white"
                    >
                      확인
                    </button>
                  </div>
                  {verified && (
                    <p className="mt-1 text-xs text-emerald-600">✓ 휴대폰 인증 완료</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="input-label">휴대폰 번호</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호를 입력해 주세요"
                className="input-field"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                이메일 인증과 별개로, 회원 정보에 등록할 연락처입니다.
              </p>
            </div>
          )}

          <div>
            <label className="input-label">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="input-field pr-12"
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

          <div>
            <label className="input-label">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="input-field pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <span className="material-symbols-outlined text-xl text-gray-400">
                  {showPasswordConfirm ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '처리 중…' : '회원가입 완료'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
          가입 시 서비스 이용약관 및 개인정보 처리방침에
          <br />
          동의하는 것으로 간주됩니다.
        </p>
      </main>

      <ConfirmModal
        open={sendConfirmOpen}
        title={verifyChannel === 'EMAIL' ? '인증 메일 발송' : '인증 문자 발송'}
        message={sendConfirmMessage}
        cancelLabel="취소"
        confirmLabel="발송"
        onCancel={() => setSendConfirmOpen(false)}
        onConfirm={() => {
          setSendConfirmOpen(false)
          void handleSendCode()
        }}
      />

      <SimpleAlertModal
        open={Boolean(error)}
        title="회원가입"
        message={error ?? ''}
        onClose={() => setError(null)}
      />
    </Layout>
  )
}

export default SignUpPage
