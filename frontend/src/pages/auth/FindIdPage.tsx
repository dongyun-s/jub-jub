/**
 * FindIdPage.tsx
 * 아이디 찾기 (데모: mocks/authMock)
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import { mockFindId } from '../../mocks/authMock'

interface FindIdPageProps {
  onBack: () => void
  onGoToFindPassword: () => void
}

function FindIdPage({ onBack, onGoToFindPassword }: FindIdPageProps) {
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
      const masked = await mockFindId(name.trim(), phone.trim())
      setResult(masked)
    } catch (err) {
      setError(err instanceof Error ? err.message : '아이디 찾기에 실패했습니다.')
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
        <span className="page-header-title">아이디 찾기</span>
        <div className="w-10" />
      </header>

      <main className="page-content">
        <div className="flex justify-center py-6">
          <img src="/logo.png" alt="JUB-JUB" className="h-24 w-auto" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-gray-900">아이디를 잊으셨나요?</h1>
          <p className="text-sm text-gray-500">가입 시 등록한 이름과 휴대폰 번호로 조회합니다.</p>
          <p className="mt-2 text-xs text-amber-800/80">데모 · 가짜 마스킹 이메일이 표시됩니다.</p>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="mb-4 rounded-lg bg-primary/5 px-4 py-3 text-center">
            <p className="text-sm text-gray-600">가입된 이메일(마스킹)</p>
            <p className="mt-1 text-lg font-semibold text-primary">{result}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성함을 입력해주세요"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">휴대폰 번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="input-field"
              required
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '조회 중…' : '아이디 찾기'}
            </button>
          </div>
        </form>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <button type="button" onClick={onBack} className="text-gray-500">
            로그인으로 돌아가기
          </button>
          <span className="text-gray-300">|</span>
          <button type="button" onClick={onGoToFindPassword} className="font-medium text-primary">
            비밀번호 찾기
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          도움이 필요하신가요?{' '}
          <button type="button" className="text-primary underline">
            고객센터 문의
          </button>
        </p>
      </main>
    </Layout>
  )
}

export default FindIdPage
