export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ロール定義
export type UserRole = 'admin' | 'manager' | 'employee'

// 雇用区分
export type EmploymentType = 'full_time' | 'part_time' | 'contract'

// 打刻種別
export type AttendanceType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end'

// 申請種別
export type RequestType = 'overtime' | 'holiday_work' | 'leave' | 'attendance_correction'

// 申請ステータス
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

// 休暇種別
export type LeaveType = 'paid' | 'substitute' | 'sick' | 'special'

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string
          employee_number: string
          name: string
          email: string
          department_id: string | null
          role: UserRole
          employment_type: EmploymentType
          manager_id: string | null
          hire_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_number: string
          name: string
          email: string
          department_id?: string | null
          role?: UserRole
          employment_type?: EmploymentType
          manager_id?: string | null
          hire_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_number?: string
          name?: string
          email?: string
          department_id?: string | null
          role?: UserRole
          employment_type?: EmploymentType
          manager_id?: string | null
          hire_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          employee_id: string
          attendance_type: AttendanceType
          recorded_at: string
          latitude: number | null
          longitude: number | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          attendance_type: AttendanceType
          recorded_at?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          attendance_type?: AttendanceType
          recorded_at?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          created_at?: string
        }
      }
      daily_attendances: {
        Row: {
          id: string
          employee_id: string
          work_date: string
          clock_in: string | null
          clock_out: string | null
          break_minutes: number
          actual_work_minutes: number
          overtime_minutes: number
          late_night_minutes: number
          status: 'present' | 'absent' | 'holiday' | 'leave'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          work_date: string
          clock_in?: string | null
          clock_out?: string | null
          break_minutes?: number
          actual_work_minutes?: number
          overtime_minutes?: number
          late_night_minutes?: number
          status?: 'present' | 'absent' | 'holiday' | 'leave'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          work_date?: string
          clock_in?: string | null
          clock_out?: string | null
          break_minutes?: number
          actual_work_minutes?: number
          overtime_minutes?: number
          late_night_minutes?: number
          status?: 'present' | 'absent' | 'holiday' | 'leave'
          created_at?: string
          updated_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          employee_id: string
          request_type: RequestType
          status: RequestStatus
          request_date: string
          start_date: string
          end_date: string
          reason: string
          leave_type: LeaveType | null
          target_attendance_id: string | null
          correction_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          request_type: RequestType
          status?: RequestStatus
          request_date?: string
          start_date: string
          end_date: string
          reason: string
          leave_type?: LeaveType | null
          target_attendance_id?: string | null
          correction_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          request_type?: RequestType
          status?: RequestStatus
          request_date?: string
          start_date?: string
          end_date?: string
          reason?: string
          leave_type?: LeaveType | null
          target_attendance_id?: string | null
          correction_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      approvals: {
        Row: {
          id: string
          request_id: string
          approver_id: string
          action: 'approved' | 'rejected' | 'returned'
          comment: string | null
          acted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          approver_id: string
          action: 'approved' | 'rejected' | 'returned'
          comment?: string | null
          acted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          approver_id?: string
          action?: 'approved' | 'rejected' | 'returned'
          comment?: string | null
          acted_at?: string
          created_at?: string
        }
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          fiscal_year: number
          leave_type: LeaveType
          granted_days: number
          used_days: number
          remaining_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          fiscal_year: number
          leave_type: LeaveType
          granted_days?: number
          used_days?: number
          remaining_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          fiscal_year?: number
          leave_type?: LeaveType
          granted_days?: number
          used_days?: number
          remaining_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      employment_type: EmploymentType
      attendance_type: AttendanceType
      request_type: RequestType
      request_status: RequestStatus
      leave_type: LeaveType
    }
  }
}

// ヘルパー型
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
