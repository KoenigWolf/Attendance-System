-- 勤怠管理システム 初期スキーマ
-- Supabase SQL Editor または CLI から実行

-- ENUM型の作成
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE attendance_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');
CREATE TYPE request_type AS ENUM ('overtime', 'holiday_work', 'leave', 'attendance_correction');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE leave_type AS ENUM ('paid', 'substitute', 'sick', 'special');
CREATE TYPE daily_status AS ENUM ('present', 'absent', 'holiday', 'leave');
CREATE TYPE approval_action AS ENUM ('approved', 'rejected', 'returned');

-- 部門テーブル
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_parent ON departments(parent_id);

-- 社員テーブル
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  role user_role NOT NULL DEFAULT 'employee',
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  manager_id UUID REFERENCES employees(id),
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_active ON employees(is_active) WHERE is_active = true;

-- 打刻記録テーブル（生データ）
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_type attendance_type NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_records_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_records_recorded ON attendance_records(recorded_at);
CREATE INDEX idx_attendance_records_employee_date ON attendance_records(employee_id, recorded_at);

-- 日次勤怠サマリテーブル
CREATE TABLE daily_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  actual_work_minutes INTEGER NOT NULL DEFAULT 0,
  overtime_minutes INTEGER NOT NULL DEFAULT 0,
  late_night_minutes INTEGER NOT NULL DEFAULT 0,
  status daily_status NOT NULL DEFAULT 'present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

CREATE INDEX idx_daily_attendances_employee ON daily_attendances(employee_id);
CREATE INDEX idx_daily_attendances_date ON daily_attendances(work_date);
CREATE INDEX idx_daily_attendances_employee_month ON daily_attendances(employee_id, work_date);

-- 申請テーブル
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_type request_type NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  leave_type leave_type,
  target_attendance_id UUID REFERENCES daily_attendances(id),
  correction_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_employee ON requests(employee_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(request_type);
CREATE INDEX idx_requests_dates ON requests(start_date, end_date);

-- 承認テーブル
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES employees(id),
  action approval_action NOT NULL,
  comment TEXT,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_request ON approvals(request_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);

-- 有休残高テーブル
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  leave_type leave_type NOT NULL,
  granted_days DECIMAL(4, 1) NOT NULL DEFAULT 0,
  used_days DECIMAL(4, 1) NOT NULL DEFAULT 0,
  remaining_days DECIMAL(4, 1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, fiscal_year, leave_type)
);

CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(fiscal_year);

-- 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- updated_at自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_attendances_updated_at
  BEFORE UPDATE ON daily_attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
