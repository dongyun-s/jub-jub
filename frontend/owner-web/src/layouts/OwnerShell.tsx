import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import styles from './OwnerShell.module.css'

const nav = [
  { to: '/dashboard', label: '대시보드', icon: 'dashboard' },
  { to: '/orders', label: '주문내역', icon: 'receipt_long' },
  { to: '/menu', label: '메뉴관리', icon: 'restaurant_menu' },
  { to: '/payments', label: '결제내역', icon: 'payments' },
  { to: '/reviews', label: '리뷰관리', icon: 'rate_review' },
] as const

export function OwnerShell() {
  const { pathname } = useLocation()

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>L.</span>
        </div>
        <nav className={styles.nav}>
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to !== '/menu'}
              className={({ isActive }: { isActive: boolean }) => {
                const active = to === '/menu' ? pathname.startsWith('/menu') : isActive
                return [styles.navItem, active ? styles.navItemActive : ''].filter(Boolean).join(' ')
              }}
            >
                <Icon name={icon} />
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
          ))}
        </nav>
        <div className={styles.profileWrap}>
          <img
            alt=""
            className={styles.avatar}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3cDY65XqTWcrEPG9vcqJ_DdQXZhruVWyERFa5jJ-Ghpq4GtypYxc8x5FHyWZzlM8ih3E_-yukxyAKZzstAJa86oe8FJ3GG3rcxWSWFjGoHDvo7U8fb6HaplKilYVN5ndjEiOLvST10nd68shXO2e3NkC3PVVHpRQdz9k2C-9IQPf84bLLoHfqPp_-pUumD0bTrUOqV-lzJ8vQg4MXVfTJHM0MYWTdgpQCfe3L3miwEkQ8eKJ2QzzteNY6jnbcgvcoE4T8semcD1p5"
          />
        </div>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
