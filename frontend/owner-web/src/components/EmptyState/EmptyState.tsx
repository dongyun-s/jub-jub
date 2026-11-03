import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap} aria-hidden>
        <Icon name={icon} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.desc}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
