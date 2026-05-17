import type { ReactNode } from 'react'
import { Icon } from './Icon'
import styles from './OwnerHeader.module.css'

type OwnerHeaderProps = {
  title: string
  subtitle?: string
  right?: ReactNode
  showSearch?: boolean
  searchPlaceholder?: string
}

export function OwnerHeader({
  title,
  subtitle,
  right,
  showSearch,
  searchPlaceholder = '검색...',
}: OwnerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.brand}>The Luminous Merchant</h1>
        <span className={styles.sep}>|</span>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </div>
      <div className={styles.right}>
        {showSearch ? (
          <div className={styles.searchWrap}>
            <Icon name="search" className={styles.searchIcon} />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className={styles.searchInput}
            />
          </div>
        ) : null}
        <div className={styles.iconRow}>
          <button type="button" className={styles.iconBtn} aria-label="알림">
            <Icon name="notifications" />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="설정">
            <Icon name="settings" />
          </button>
        </div>
        {right}
      </div>
    </header>
  )
}
