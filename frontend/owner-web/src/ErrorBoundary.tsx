import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#121416',
            color: '#e2e2e5',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ color: '#ff4d8d', fontSize: 20, marginBottom: 12 }}>사장님 콘솔 오류</h1>
          <p style={{ marginBottom: 16, opacity: 0.85 }}>
            화면이 비어 있거나 검게 보이면, 아래 메시지와 브라우저 개발자 도구(F12) → Console 탭을 확인하세요.
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              padding: 16,
              borderRadius: 8,
              background: '#1a1c1e',
              border: '1px solid #333537',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
