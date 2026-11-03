import { useState } from 'react'
import type { TierTheme } from '../../lib/rewardTierTheme'
import styles from './RankingEntryAvatar.module.css'

type AvatarSize = 'md' | 'sm' | 'podium' | 'podiumElevated'

interface RankingEntryAvatarProps {
  imageUrl?: string
  theme: TierTheme
  size?: AvatarSize
  className?: string
}

function isValidImageUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  )
}

export default function RankingEntryAvatar({
  imageUrl,
  theme,
  size = 'md',
  className = '',
}: RankingEntryAvatarProps) {
  const src = imageUrl?.trim() ?? ''
  const [loadFailed, setLoadFailed] = useState(false)
  const showImg = !loadFailed && Boolean(src) && isValidImageUrl(src)

  const sizeClass =
    size === 'podiumElevated'
      ? `${styles.podium} ${styles.podiumElevated}`
      : styles[size]

  return (
    <div
      className={`${styles.wrap} ${sizeClass} ${className}`.trim()}
      style={{
        boxShadow: theme.myAvatarGlow,
        borderColor: theme.myAvatarRing,
      }}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          className={styles.img}
          onError={() => setLoadFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: size === 'sm' ? '1.5rem' : size === 'podium' ? '1.75rem' : '2.25rem',
            color: theme.myAvatarIcon,
          }}
        >
          face_6
        </span>
      )}
    </div>
  )
}
