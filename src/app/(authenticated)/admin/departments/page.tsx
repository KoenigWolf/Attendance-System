'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styles from './page.module.css'

interface Department {
  id: string
  name: string
  parent_id: string | null
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    setDepartments(data || [])
  }

  const handleAdd = async () => {
    if (!newDeptName.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from('departments').insert({
      name: newDeptName.trim(),
    })

    setNewDeptName('')
    await fetchDepartments()
    setIsLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return

    const supabase = createClient()
    await supabase
      .from('departments')
      .update({ name: editingName.trim() })
      .eq('id', id)

    setEditingId(null)
    setEditingName('')
    await fetchDepartments()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この部門を削除しますか？')) return

    const supabase = createClient()
    await supabase.from('departments').delete().eq('id', id)
    await fetchDepartments()
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>部門管理</h1>

      <Card className={styles.addCard}>
        <CardHeader>
          <CardTitle>部門を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.addForm}>
            <Input
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="部門名"
            />
            <Button onClick={handleAdd} isLoading={isLoading}>
              追加
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>部門一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>部門名</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>
                    {editingId === dept.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      dept.name
                    )}
                  </td>
                  <td className={styles.actions}>
                    {editingId === dept.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName('')
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(dept.id)}
                        >
                          保存
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(dept.id)
                            setEditingName(dept.name)
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(dept.id)}
                        >
                          削除
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {departments.length === 0 && (
            <p className={styles.empty}>部門が登録されていません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
