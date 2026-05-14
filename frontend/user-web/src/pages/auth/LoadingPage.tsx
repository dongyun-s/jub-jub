/**
 * LoadingPage.tsx
 * 앱 최초 실행 시 보이는 로딩 화면
 * - 로고·진행률 바 애니메이션, 3초 후 App에서 로그인 페이지로 전환
 */

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'

function LoadingPage() {
  const [progress, setProgress] = useState(0)
  const [showLogo, setShowLogo] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 100)
    setTimeout(() => setShowProgress(true), 500)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <Layout>
      <section className="flex-1 flex flex-col items-center justify-center px-6">
        <div className={`animate-fade-in ${showLogo ? 'show' : 'hide'}`}>
          <img 
            src="/logo.png" 
            alt="JUB-JUB" 
            className="h-40 w-auto drop-shadow-lg animate-bounce-slow"
          />
        </div>
        <h1 className={`mt-6 text-title animate-fade-in delay-200 ${showLogo ? 'show' : 'hide'}`}>
          JUB-JUB
        </h1>
      </section>

      <section className={`px-8 pb-16 space-y-4 animate-fade-in ${showProgress ? 'show' : 'hide'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium text-gray-800">퀘스트 데이터를 불러오는 중...</p>
            <p className="text-sm text-primary animate-pulse">데이터 동기화 진행 중</p>
          </div>
          <span className="text-2xl font-bold text-primary tabular-nums">{progress}%</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <footer className="pt-8 flex flex-col items-center gap-3">
          <p className="text-xs font-medium tracking-widest text-gray-400">POWERED BY JUB-JUB</p>
          <div className="flex gap-1.5">
            {[0, 200, 400].map((delay) => (
              <span 
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </footer>
      </section>
    </Layout>
  )
}

export default LoadingPage
