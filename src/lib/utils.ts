import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr: string = 'yyyy/MM/dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: ja })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: ja })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy/MM/dd HH:mm', { locale: ja })
}

export function minutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
