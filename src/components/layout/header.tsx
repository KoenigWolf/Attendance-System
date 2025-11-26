'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import styles from './header.module.css'

interface Employee {
  id: string
  name: string
  department_name: string | null
}

interface HeaderProps {
  employee: Employee | null
}

export function Header({ employee }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className={styles.header}>
      <div className={styles.left} />
      <div className={styles.right}>
        {employee && (
          <div className={styles.userInfo}>
            <span className={styles.name}>{employee.name}</span>
            <span className={styles.department}>
              {employee.department_name || '未所属'}
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
    </header>
  )
}
