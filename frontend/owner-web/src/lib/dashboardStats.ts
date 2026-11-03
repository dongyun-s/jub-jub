/** 주간 매출 값 → SVG polyline / area path (viewBox 1000×200) */

export function buildWeeklySalesPaths(values: number[]): { line: string; area: string } {
  if (!values.length) {
    return { line: 'M0,150 L1000,150', area: 'M0,150 L1000,150 V200 H0 Z' }
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const n = values.length
  const padY = 20
  const usableH = 200 - padY * 2

  const points = values.map((v, i) => {
    const x = n === 1 ? 500 : (i / (n - 1)) * 1000
    const t = (v - min) / span
    const y = padY + usableH * (1 - t)
    return { x, y }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const area = `${line} L${last.x.toFixed(1)},200 L${first.x.toFixed(1)},200 Z`
  return { line, area }
}

export function formatWon(amount: number): string {
  return `₩ ${Math.round(amount).toLocaleString('ko-KR')}`
}

export function formatTrendPct(pct: number): string {
  const abs = Math.abs(pct)
  const label = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)
  return `${pct >= 0 ? '' : '-'}${label}%`
}

export function reviewRelativeLabel(iso?: string): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const diffMs = Date.now() - t
  if (diffMs < 0) return '방금'
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return iso.slice(0, 10)
}
