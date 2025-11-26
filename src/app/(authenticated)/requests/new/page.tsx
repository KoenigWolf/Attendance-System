'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RequestType, LeaveType } from '@/types/database'
import styles from './page.module.css'

export default function NewRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [employeeId, setEmployeeId] = useState<string>('')

  const [formData, setFormData] = useState({
    request_type: 'leave' as RequestType,
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: 'paid' as LeaveType,
  })

  useEffect(() => {
    const fetchEmployee = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (emp) setEmployeeId(emp.id)
      }
    }
    fetchEmployee()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) return

    setIsLoading(true)
    setError('')

    const supabase = createClient()

    const { error: insertError } = await supabase.from('requests').insert({
      employee_id: employeeId,
      request_type: formData.request_type,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      reason: formData.reason,
      leave_type: formData.request_type === 'leave' ? formData.leave_type : null,
    })

    if (insertError) {
      setError('申請の登録に失敗しました')
      setIsLoading(false)
      return
    }

    router.push('/requests')
    router.refresh()
  }

  const requestTypeLabels: Record<RequestType, string> = {
    overtime: '残業申請',
    holiday_work: '休日出勤申請',
    leave: '休暇申請',
    attendance_correction: '勤怠修正申請',
  }

  const leaveTypeLabels: Record<LeaveType, string> = {
    paid: '有給休暇',
    substitute: '代休',
    sick: '病欠',
    special: '特別休暇',
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>新規申請</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="request_type" className={styles.label}>
                申請種別
              </label>
              <select
                id="request_type"
                className={styles.select}
                value={formData.request_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    request_type: e.target.value as RequestType,
                  })
                }
                required
              >
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {formData.request_type === 'leave' && (
              <div className={styles.field}>
                <label htmlFor="leave_type" className={styles.label}>
                  休暇種別
                </label>
                <select
                  id="leave_type"
                  className={styles.select}
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leave_type: e.target.value as LeaveType,
                    })
                  }
                  required
                >
                  {Object.entries(leaveTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.dateRange}>
              <Input
                id="start_date"
                type="date"
                label="開始日"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
              />
              <Input
                id="end_date"
                type="date"
                label="終了日"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reason" className={styles.label}>
                申請理由
              </label>
              <textarea
                id="reason"
                className={styles.textarea}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
                rows={4}
                placeholder="申請理由を入力してください"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button type="submit" isLoading={isLoading}>
                申請する
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
