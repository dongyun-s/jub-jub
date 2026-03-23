/**
 * SignUpPage.tsx
 * 회원가입 (데모: mocks/authMock)
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  mockSignup,
  mockVerifyConfirm,
  mockVerifySend,
  type MockVerificationType,
} from '../../mocks/authMock'

interface SignUpPageProps {
  onSignUp: () => void
  onBack: () => void
}

function SignUpPage({ onSignUp, onBack }: SignUpPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const [verifyChannel, setVerifyChannel] = useState<MockVerificationType>('SMS')
  const [logId, setLogId] = useState<number | null>(null)
  const [verified, setVerified] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const targetForSend = verifyChannel === 'EMAIL' ? email.trim() : phone.trim()

  const handleSendCode = async () => {
    setError(null)
    setInfo(null)
    if (!targetForSend) {
      setError(verifyChannel === 'EMAIL' ? '이메일을 입력해 주세요.' : '휴대폰 번호를 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await mockVerifySend(verifyChannel, targetForSend)
      setLogId(res.logId)
      setVerified(false)
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
      const res = await mockVerifyConfirm(logId, verifyCode.trim())
      if (res.isVerified) {
        setVerified(true)
        setInfo('인증이 완료되었습니다. 아래 정보를 확인한 뒤 가입을 완료하세요.')
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
      setError('휴대폰 또는 이메일 인증을 완료해 주세요.')
      return
    }
    if (email.trim() !== emailConfirm.trim()) {
      setError('이메일과 이메일 확인이 일치하지 않습니다.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await mockSignup({
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
          ① 인증번호 발송 → ② 인증 확인 → ③ 정보 입력 후 가입
        </p>
        <p className="mb-3 text-center text-xs text-amber-800/80">데모: 인증번호는 아무 6자리나 입력하면 통과합니다.</p>

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
                setLogId(null)
                setVerified(false)
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

          <div>
            <label className="input-label">이메일 확인</label>
            <input
              type="email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              placeholder="이메일을 다시 입력하세요"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">휴대폰 번호</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678 또는 010-0000-0000"
                className="input-field flex-1"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="whitespace-nowrap rounded-full bg-primary px-4 text-sm font-medium text-white"
              >
                인증번호 전송
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {verifyChannel === 'SMS'
                ? 'SMS는 위 휴대폰 번호로 발송됩니다.'
                : '이메일 인증은 위 이메일 주소로 발송됩니다.'}
            </p>
          </div>

          <div>
            <label className="input-label">인증번호</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="인증번호 6자리"
                className="input-field flex-1"
                maxLength={6}
                inputMode="numeric"
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
            {verified && <p className="mt-1 text-xs text-emerald-600">✓ 인증 완료</p>}
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
