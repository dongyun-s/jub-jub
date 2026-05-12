function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-primary">JubJub 사장님</h1>
        <p className="mt-1 text-sm text-slate-500">매장 관리 콘솔 (준비 중)</p>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-600">
            이 앱은 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">frontend/owner-web</code> 입니다.
            로컬 개발은 저장소 루트에서 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev:owner</code>{' '}
            (포트 5174)을 사용하세요.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
