'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import styles from './approval-actions.module.css'

interface ApprovalActionsProps {
  requestId: string
  approverId: string
}

export function ApprovalActions({ requestId, approverId }: ApprovalActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)

  const handleAction = async (action: 'approved' | 'rejected' | 'returned') => {
    setIsLoading(action)
    const supabase = createClient()

    // 承認レコードを作成
    const { error: approvalError } = await supabase.from('approvals').insert({
      request_id: requestId,
      approver_id: approverId,
      action,
      comment: comment || null,
    })

    if (approvalError) {
      setIsLoading(null)
      return
    }

    // 申請ステータスを更新
    const newStatus = action === 'returned' ? 'pending' : action
    await supabase
      .from('requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    router.refresh()
    setIsLoading(null)
  }

  return (
    <div className={styles.container}>
      {showComment && (
        <div className={styles.commentField}>
          <textarea
            className={styles.textarea}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメント（任意）"
            rows={2}
          />
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComment(!showComment)}
        >
          {showComment ? 'コメントを隠す' : 'コメントを追加'}
        </Button>
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('returned')}
            isLoading={isLoading === 'returned'}
            disabled={isLoading !== null}
          >
            差し戻し
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleAction('rejected')}
            isLoading={isLoading === 'rejected'}
            disabled={isLoading !== null}
          >
            却下
          </Button>
          <Button
            size="sm"
            onClick={() => handleAction('approved')}
            isLoading={isLoading === 'approved'}
            disabled={isLoading !== null}
          >
            承認
          </Button>
        </div>
      </div>
    </div>
  )
}
