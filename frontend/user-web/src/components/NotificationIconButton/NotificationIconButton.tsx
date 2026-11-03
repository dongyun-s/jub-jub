import styles from './NotificationIconButton.module.css'

interface NotificationIconButtonProps {
  unreadCount?: number
  onClick?: () => void
  className?: string
}

export default function NotificationIconButton({
  unreadCount = 0,
  onClick,
  className,
}: NotificationIconButtonProps) {
  const showBadge = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.root} ${className ?? ''}`.trim()}
      aria-label={showBadge ? `알림, 읽지 않음 ${unreadCount}개` : '알림'}
    >
      <span className="material-symbols-outlined">notifications</span>
      {showBadge && (
        <span className={styles.badge} aria-hidden>
          {badgeLabel}
        </span>
      )}
    </button>
  )
}
