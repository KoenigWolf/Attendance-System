'use client'

import { useState, useEffect, memo } from 'react'
import { formatDate, formatTime } from '@/lib/utils'

interface ClockDisplayProps {
  dateClassName?: string
  timeClassName?: string
  secondsClassName?: string
}

export const ClockDisplay = memo(function ClockDisplay({
  dateClassName,
  timeClassName,
  secondsClassName,
}: ClockDisplayProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <h3 className={dateClassName}>
        {currentTime ? formatDate(currentTime, 'yyyy年M月d日(E)') : '--'}
      </h3>
      <div>
        <span className={timeClassName}>
          {currentTime ? formatTime(currentTime) : '--:--'}
        </span>
        <span className={secondsClassName}>
          :{currentTime ? currentTime.getSeconds().toString().padStart(2, '0') : '--'}
        </span>
      </div>
    </>
  )
})
