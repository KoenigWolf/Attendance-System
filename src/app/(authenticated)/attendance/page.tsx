import { createClient } from '@/lib/supabase/server'
import { AttendanceClient } from './attendance-client'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // まず社員情報を取得
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!employee) {
    return <AttendanceClient initialEmployee={null} initialRecords={[]} />
  }

  // 社員IDがわかったら今日の打刻記録を取得
  const today = new Date().toISOString().split('T')[0]
  const { data: records } = await supabase
    .from('attendance_records')
    .select('id, attendance_type, recorded_at')
    .eq('employee_id', employee.id)
    .gte('recorded_at', `${today}T00:00:00`)
    .lt('recorded_at', `${today}T23:59:59`)
    .order('recorded_at', { ascending: true })

  return (
    <AttendanceClient
      initialEmployee={employee}
      initialRecords={records || []}
    />
  )
}
