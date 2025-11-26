-- Row Level Security (RLS) ポリシー設定

-- RLSを有効化
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数: 現在のユーザーの社員情報を取得
CREATE OR REPLACE FUNCTION get_current_employee()
RETURNS employees AS $$
  SELECT * FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー関数: 現在のユーザーが管理者かどうか
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー関数: 現在のユーザーがマネージャー以上かどうか
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー関数: 対象社員の上長かどうか
CREATE OR REPLACE FUNCTION is_manager_of(target_employee_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees target
    JOIN employees manager ON target.manager_id = manager.id
    WHERE target.id = target_employee_id
    AND manager.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- departments ポリシー
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT USING (true);

CREATE POLICY "departments_insert_admin" ON departments
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "departments_update_admin" ON departments
  FOR UPDATE USING (is_admin());

CREATE POLICY "departments_delete_admin" ON departments
  FOR DELETE USING (is_admin());

-- employees ポリシー
CREATE POLICY "employees_select_own" ON employees
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_manager_of(id)
    -- 同じ部門のメンバーも参照可能（マネージャー以上）
    OR (is_manager_or_above() AND department_id IN (
      SELECT department_id FROM employees WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "employees_insert_admin" ON employees
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "employees_update_admin" ON employees
  FOR UPDATE USING (is_admin());

CREATE POLICY "employees_delete_admin" ON employees
  FOR DELETE USING (is_admin());

-- attendance_records ポリシー
CREATE POLICY "attendance_records_select" ON attendance_records
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
    OR is_manager_of(employee_id)
  );

CREATE POLICY "attendance_records_insert_own" ON attendance_records
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "attendance_records_update_admin" ON attendance_records
  FOR UPDATE USING (is_admin());

-- daily_attendances ポリシー
CREATE POLICY "daily_attendances_select" ON daily_attendances
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
    OR is_manager_of(employee_id)
  );

CREATE POLICY "daily_attendances_insert" ON daily_attendances
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "daily_attendances_update" ON daily_attendances
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
  );

-- requests ポリシー
CREATE POLICY "requests_select" ON requests
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
    OR is_manager_of(employee_id)
  );

CREATE POLICY "requests_insert_own" ON requests
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "requests_update" ON requests
  FOR UPDATE USING (
    -- 本人は取り下げのみ可能（pending状態の場合）
    (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND status = 'pending')
    OR is_admin()
    OR is_manager_of(employee_id)
  );

-- approvals ポリシー
CREATE POLICY "approvals_select" ON approvals
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM requests
      WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
    OR approver_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "approvals_insert" ON approvals
  FOR INSERT WITH CHECK (
    approver_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
  );

-- leave_balances ポリシー
CREATE POLICY "leave_balances_select" ON leave_balances
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR is_admin()
    OR is_manager_of(employee_id)
  );

CREATE POLICY "leave_balances_insert_admin" ON leave_balances
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "leave_balances_update_admin" ON leave_balances
  FOR UPDATE USING (is_admin());

-- audit_logs ポリシー（管理者のみ参照可能）
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
