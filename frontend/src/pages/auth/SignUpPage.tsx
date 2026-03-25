/**
 * SignUpPage.tsx
 * 회원가입
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  signup,
  verifyConfirm,
  verifySend,
  type VerificationType,
} from '../../api/auth'

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

  const [verifyChannel, setVerifyChannel] = useState<VerificationType>('EMAIL')
  const [logId, setLogId] = useState<number | null>(null)
  const [verified, setVerified] = useState(false)
  /** 발송에 사용한 주소(이메일 또는 전화번호). 인증 완료·가입 시 이 값과 일치해야 함 */
  const [verificationTargetSent, setVerificationTargetSent] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const targetForSend = verifyChannel === 'EMAIL' ? email.trim() : phone.trim()

  const resetVerification = () => {
    setLogId(null)
    setVerified(false)
    setVerificationTargetSent(null)
    setVerifyCode('')
  }

  const handleSendCode = async () => {
    setError(null)
    setInfo(null)
    if (!targetForSend) {
      setError(verifyChannel === 'EMAIL' ? '이메일을 입력해 주세요.' : '휴대폰 번호를 입력해 주세요.')
      return
    }
    if (verifyChannel === 'EMAIL') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetForSend)
      if (!ok) {
        setError('올바른 이메일 형식을 입력해 주세요.')
        return
      }
    }
    setLoading(true)
    try {
      const res = await verifySend(verifyChannel, targetForSend)
      setLogId(res.logId)
      setVerified(false)
      setVerificationTargetSent(targetForSend)
      setInfo(`인증번호를 발송했습니다. (만료: ${res.expiresAt})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.')
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
        setError('인증번호가 올바르지 않습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 확인에 실패했습니다.')
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
    if (verificationTargetSent) {
      if (verifyChannel === 'EMAIL' && email.trim() !== verificationTargetSent) {
        setError('인증한 이메일과 현재 입력한 이메일이 같아야 합니다. 다시 인증해 주세요.')
        return
      }
      if (verifyChannel === 'SMS' && phone.trim() !== verificationTargetSent) {
        setError('인증한 휴대폰 번호와 현재 입력이 같아야 합니다. 다시 인증해 주세요.')
        return
      }
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
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
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
            ? '① 이메일로 인증번호 발송 → ② 인증번호 확인 → ③ 나머지 정보 입력 후 가입'
            : '① 휴대폰으로 인증번호 발송 → ② 인증번호 확인 → ③ 나머지 정보 입력 후 가입'}
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-full border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => {
                setVerifyChannel('SMS')
                resetVerification()
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
                resetVerification()
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
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (verifyChannel === 'EMAIL' && (verified || logId != null)) resetVerification()
                }}
                placeholder="example@mail.com"
                className="input-field flex-1"
                required
                autoComplete="email"
              />
              {verifyChannel === 'EMAIL' && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full bg-primary px-4 text-sm font-medium text-white"
                >
                  인증번호 전송
                </button>
              )}
            </div>
            {verifyChannel === 'EMAIL' && (
              <p className="mt-1 text-xs text-gray-400">가입에 사용할 이메일로 인증번호가 발송됩니다.</p>
            )}
          </div>

          {verifyChannel === 'EMAIL' && (
            <div>
              <label className="input-label">인증번호 확인</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="메일로 받은 인증번호 6자리"
                  className="input-field flex-1"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="rounded-full bg-primary px-6 text-sm font-medium text-white"
                >
                  확인
                </button>
              </div>
              {verified && (
                <p className="mt-1 text-xs text-emerald-600">
                  ✓ 이메일 인증 완료
                  {verificationTargetSent ? ` (${verificationTargetSent})` : ''}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="input-label">휴대폰 번호</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (verifyChannel === 'SMS' && (verified || logId != null)) resetVerification()
                }}
                placeholder="010-1234-5678"
                className="input-field flex-1"
                required
                autoComplete="tel"
              />
              {verifyChannel === 'SMS' && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full bg-primary px-4 text-sm font-medium text-white"
                >
                  인증번호 전송
                </button>
              )}
            </div>
            {verifyChannel === 'SMS' && (
              <p className="mt-1 text-xs text-gray-400">SMS는 위 휴대폰 번호로 발송됩니다.</p>
            )}
            {verifyChannel === 'EMAIL' && (
              <p className="mt-1 text-xs text-gray-400">회원 정보용 휴대폰 번호입니다. 이메일 인증과는 별도입니다.</p>
            )}
          </div>

          {verifyChannel === 'SMS' && (
            <div>
              <label className="input-label">인증번호 확인</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="문자로 받은 인증번호 6자리"
                  className="input-field flex-1"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="rounded-full bg-primary px-6 text-sm font-medium text-white"
                >
                  확인
                </button>
              </div>
              {verified && (
                <p className="mt-1 text-xs text-emerald-600">
                  ✓ 휴대폰 인증 완료
                  {verificationTargetSent ? ` (${verificationTargetSent})` : ''}
                </p>
              )}
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
    </Layout>
  )
}

export default SignUpPage
