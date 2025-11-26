'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import styles from './sidebar.module.css'

interface Employee {
  id: string
  name: string
  role: 'admin' | 'manager' | 'employee'
  department_name: string | null
}

interface SidebarProps {
  employee: Employee | null
}

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: 'home' },
  { href: '/attendance', label: '打刻', icon: 'clock' },
  { href: '/attendance/history', label: '勤怠履歴', icon: 'calendar' },
  { href: '/requests', label: '申請', icon: 'file' },
  { href: '/requests/approval', label: '承認', icon: 'check', roles: ['admin', 'manager'] },
]

const adminItems = [
  { href: '/admin/employees', label: '社員管理', icon: 'users' },
  { href: '/admin/departments', label: '部門管理', icon: 'building' },
  { href: '/admin/reports', label: 'レポート', icon: 'chart' },
]

export function Sidebar({ employee }: SidebarProps) {
  const pathname = usePathname()
  const role = employee?.role || 'employee'
  const isAdmin = role === 'admin'

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(role)
  })

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>勤怠管理</h1>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  styles.navItem,
                  pathname === item.href && styles.active
                )}
              >
                <span className={styles.icon}>{getIcon(item.icon)}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <>
            <div className={styles.divider} />
            <p className={styles.sectionTitle}>管理</p>
            <ul className={styles.navList}>
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      styles.navItem,
                      pathname === item.href && styles.active
                    )}
                  >
                    <span className={styles.icon}>{getIcon(item.icon)}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </aside>
  )
}

function getIcon(name: string) {
  const icons: Record<string, string> = {
    home: '🏠',
    clock: '⏰',
    calendar: '📅',
    file: '📄',
    check: '✅',
    users: '👥',
    building: '🏢',
    chart: '📊',
  }
  return icons[name] || '📌'
}
