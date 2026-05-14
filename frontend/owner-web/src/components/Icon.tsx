import type { CSSProperties } from 'react'

type IconProps = {
  name: string
  className?: string
  filled?: boolean
  style?: CSSProperties
}

export function Icon({ name, className = '', filled, style }: IconProps) {
  const merged: CSSProperties = {
    ...style,
    ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
  }
  return (
    <span className={`material-symbols-outlined ${className}`} style={merged}>
      {name}
    </span>
  )
}
