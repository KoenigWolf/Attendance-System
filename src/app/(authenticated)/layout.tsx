import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import styles from './layout.module.css'

interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  department_name: string | null
}

async function getEmployee(userId: string): Promise<Employee | null> {
  const supabase = await createClient()

  // JOINで1クエリに最適化
  const { data } = await supabase
    .from('employees')
    .select('id, name, email, role, departments(name)')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  const departments = data.departments as { name: string } | { name: string }[] | null
  const departmentName = Array.isArray(departments) ? departments[0]?.name : departments?.name

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    department_name: departmentName || null,
  }
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const employee = await getEmployee(user.id)

  return (
    <div className={styles.layout}>
      <Sidebar employee={employee} />
      <div className={styles.main}>
        <Header employee={employee} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
