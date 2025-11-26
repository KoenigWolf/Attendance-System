/**
 * エラーハンドリングユーティリティ
 */

// エラータイプの定義
export type AppErrorCode =
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: AppErrorCode
  message: string
  details?: unknown
  timestamp: string
}

// ユーザー向けエラーメッセージ
const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_ERROR: '認証エラーが発生しました。再度ログインしてください',
  VALIDATION_ERROR: '入力内容に誤りがあります',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
  DATABASE_ERROR: 'データベースエラーが発生しました。しばらく待ってから再試行してください',
  PERMISSION_ERROR: 'この操作を行う権限がありません',
  NOT_FOUND: '指定されたデータが見つかりません',
  RATE_LIMITED: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
}

/**
 * エラーをAppError形式に変換
 */
export function createAppError(
  code: AppErrorCode,
  details?: unknown
): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    details,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Supabaseエラーをパース
 */
export function parseSupabaseError(error: unknown): AppError {
  if (!error || typeof error !== 'object') {
    return createAppError('UNKNOWN_ERROR', error)
  }

  const err = error as { code?: string; message?: string; status?: number }

  // 認証エラー
  if (err.code?.includes('auth') || err.status === 401) {
    return createAppError('AUTH_ERROR', error)
  }

  // 権限エラー
  if (err.status === 403 || err.code === 'PGRST301') {
    return createAppError('PERMISSION_ERROR', error)
  }

  // Not Found
  if (err.status === 404 || err.code === 'PGRST116') {
    return createAppError('NOT_FOUND', error)
  }

  // レート制限
  if (err.status === 429) {
    return createAppError('RATE_LIMITED', error)
  }

  // バリデーションエラー
  if (err.code === '23505' || err.code === '23503' || err.code === '22P02') {
    return createAppError('VALIDATION_ERROR', error)
  }

  // ネットワークエラー
  if (err.message?.includes('network') || err.message?.includes('fetch')) {
    return createAppError('NETWORK_ERROR', error)
  }

  return createAppError('DATABASE_ERROR', error)
}

/**
 * エラーをコンソールにログ（開発環境のみ詳細表示）
 */
export function logError(error: AppError, context?: string): void {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    console.error(`[${error.code}]${context ? ` ${context}:` : ''}`, {
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
    })
  } else {
    // 本番環境では最小限のログ
    console.error(`[${error.code}] ${error.timestamp}`)
  }
}

/**
 * try-catchのラッパー
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T; error: null } | { data: null; error: AppError }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (err) {
    const appError = parseSupabaseError(err)
    logError(appError, context)
    return { data: null, error: appError }
  }
}

/**
 * ユーザー向けエラーメッセージを取得
 */
export function getUserMessage(error: AppError): string {
  return error.message
}

/**
 * トースト通知用のエラーメッセージ
 */
export function getToastMessage(error: AppError): {
  title: string
  description: string
  variant: 'error' | 'warning'
} {
  const isWarning = error.code === 'VALIDATION_ERROR' || error.code === 'NOT_FOUND'

  return {
    title: isWarning ? '確認が必要です' : 'エラー',
    description: error.message,
    variant: isWarning ? 'warning' : 'error',
  }
}
