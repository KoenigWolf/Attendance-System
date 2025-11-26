'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import styles from './month-selector.module.css'

interface MonthSelectorProps {
  currentMonth: string
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter()
  const [year, month] = currentMonth.split('-').map(Number)

  const goToPrevMonth = () => {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    router.push(`/attendance/history?month=${prevYear}-${String(prevMonth).padStart(2, '0')}`)
  }

  const goToNextMonth = () => {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    router.push(`/attendance/history?month=${nextYear}-${String(nextMonth).padStart(2, '0')}`)
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    router.push(
      `/attendance/history?month=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    )
  }

  return (
    <div className={styles.selector}>
      <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
        ←
      </Button>
      <span className={styles.current}>
        {year}年{month}月
      </span>
      <Button variant="ghost" size="sm" onClick={goToNextMonth}>
        →
      </Button>
      <Button variant="secondary" size="sm" onClick={goToCurrentMonth}>
        今月
      </Button>
    </div>
  )
}
