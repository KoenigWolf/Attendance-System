import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import styles from './page.module.css'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 管理者チェック
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (currentEmployee?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 社員一覧を取得
  const { data: employees } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      manager:employees!employees_manager_id_fkey(name)
    `)
    .order('employee_number', { ascending: true })

  const roleLabels: Record<string, string> = {
    admin: '管理者',
    manager: 'マネージャー',
    employee: '一般社員',
  }

  const employmentTypeLabels: Record<string, string> = {
    full_time: '正社員',
    part_time: 'パート',
    contract: '契約社員',
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>社員管理</h1>
        <Link href="/admin/employees/new">
          <Button>新規登録</Button>
        </Link>
      </div>

      <Card>
        <CardContent className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>社員番号</th>
                <th>氏名</th>
                <th>メールアドレス</th>
                <th>部門</th>
                <th>役職</th>
                <th>雇用区分</th>
                <th>入社日</th>
                <th>ステータス</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.employee_number}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.departments?.name || '-'}</td>
                  <td>{roleLabels[emp.role]}</td>
                  <td>{employmentTypeLabels[emp.employment_type]}</td>
                  <td>{formatDate(emp.hire_date)}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        emp.is_active ? styles.active : styles.inactive
                      }`}
                    >
                      {emp.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/employees/${emp.id}`}>
                      <Button variant="ghost" size="sm">
                        編集
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!employees || employees.length === 0) && (
            <p className={styles.empty}>社員が登録されていません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
