import styles from './LocationPermissionBanner.module.css'

interface LocationPermissionBannerProps {
  message: string
  onRetry?: () => void
  loading?: boolean
  title?: string
}

export function LocationPermissionBanner({
  message,
  onRetry,
  loading = false,
  title = '위치(GPS) 권한이 필요해요',
}: LocationPermissionBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden>
        location_disabled
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.message}>{message}</p>
        {onRetry && (
          <button type="button" className={styles.retryButton} onClick={onRetry} disabled={loading}>
            <span className={`material-symbols-outlined ${styles.retryIcon}`}>my_location</span>
            {loading ? '위치 확인 중…' : '위치 권한 다시 요청'}
          </button>
        )}
      </div>
    </div>
  )
}
