import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NewOrderAlertHost } from '../components/NewOrderAlertHost/NewOrderAlertHost'
import { OwnerNotificationBanner } from '../components/OwnerNotificationBanner/OwnerNotificationBanner'
import { OwnerOrdersProvider } from '../context/OwnerOrdersProvider'
import { OwnerSalesProvider } from '../context/OwnerSalesProvider'
import styles from './OwnerShell.module.css'

const nav: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/dashboard', label: '대시보드', icon: 'dashboard' },
  { to: '/sales', label: '영업 상태', icon: 'storefront' },
  { to: '/orders', label: '실시간 주문', icon: 'receipt_long', end: true },
  { to: '/orders/completed', label: '완료 주문', icon: 'task_alt' },
  { to: '/store', label: '매장 정보', icon: 'store' },
  { to: '/menu', label: '메뉴관리', icon: 'restaurant_menu' },
  { to: '/payments', label: '결제내역', icon: 'payments' },
  { to: '/reviews', label: '리뷰관리', icon: 'rate_review' },
]

export function OwnerShell() {
  const { pathname } = useLocation()

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <img src="/logo.png" alt="JubJub" className={styles.logoImg} width={36} height={36} />
          <span className={styles.logoText}>줍줍</span>
        </div>
        <nav className={styles.nav}>
          {nav.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? to !== '/menu'}
              className={({ isActive }: { isActive: boolean }) => {
                const active =
                  to === '/menu'
                    ? pathname.startsWith('/menu')
                    : to === '/store'
                      ? pathname.startsWith('/store')
                      : to === '/orders'
                      ? pathname === '/orders'
                      : isActive
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
        <OwnerSalesProvider>
          <OwnerOrdersProvider>
            <OwnerNotificationBanner />
            <NewOrderAlertHost />
            <Outlet />
          </OwnerOrdersProvider>
        </OwnerSalesProvider>
      </div>
    </div>
  )
}
