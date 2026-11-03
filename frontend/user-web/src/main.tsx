/**
 * main.tsx
 * 앱 진입점 (Entry Point)
 * - React 18 createRoot로 #root에 앱 마운트
 * - StrictMode로 개발 시 부작용·deprecated 감지
 * - index.css 로드로 Tailwind·전역 스타일 적용
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
