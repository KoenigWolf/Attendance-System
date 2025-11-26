-- ビューと集計関数

-- 月次勤怠サマリビュー
CREATE OR REPLACE VIEW monthly_attendance_summary AS
SELECT
  employee_id,
  DATE_TRUNC('month', work_date)::DATE as month,
  COUNT(*) FILTER (WHERE status = 'present') as work_days,
  COUNT(*) FILTER (WHERE status = 'leave') as leave_days,
  COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
  SUM(actual_work_minutes) as total_work_minutes,
  SUM(overtime_minutes) as total_overtime_minutes,
  SUM(late_night_minutes) as total_late_night_minutes,
  SUM(break_minutes) as total_break_minutes
FROM daily_attendances
GROUP BY employee_id, DATE_TRUNC('month', work_date);

-- 部門別月次サマリビュー
CREATE OR REPLACE VIEW department_monthly_summary AS
SELECT
  e.department_id,
  d.name as department_name,
  DATE_TRUNC('month', da.work_date)::DATE as month,
  COUNT(DISTINCT da.employee_id) as employee_count,
  SUM(da.actual_work_minutes) as total_work_minutes,
  SUM(da.overtime_minutes) as total_overtime_minutes,
  AVG(da.actual_work_minutes)::INTEGER as avg_work_minutes,
  AVG(da.overtime_minutes)::INTEGER as avg_overtime_minutes
FROM daily_attendances da
JOIN employees e ON da.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.is_active = true
GROUP BY e.department_id, d.name, DATE_TRUNC('month', da.work_date);

-- 打刻から日次勤怠を計算・更新する関数
CREATE OR REPLACE FUNCTION calculate_daily_attendance(
  p_employee_id UUID,
  p_work_date DATE
)
RETURNS void AS $$
DECLARE
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_break_end TIMESTAMPTZ;
  v_break_minutes INTEGER := 0;
  v_work_minutes INTEGER := 0;
  v_overtime_minutes INTEGER := 0;
  v_late_night_minutes INTEGER := 0;
  v_standard_work_minutes INTEGER := 480; -- 8時間
BEGIN
  -- 当日の打刻記録を取得
  SELECT recorded_at INTO v_clock_in
  FROM attendance_records
  WHERE employee_id = p_employee_id
    AND DATE(recorded_at AT TIME ZONE 'Asia/Tokyo') = p_work_date
    AND attendance_type = 'clock_in'
  ORDER BY recorded_at ASC
  LIMIT 1;

  SELECT recorded_at INTO v_clock_out
  FROM attendance_records
  WHERE employee_id = p_employee_id
    AND DATE(recorded_at AT TIME ZONE 'Asia/Tokyo') = p_work_date
    AND attendance_type = 'clock_out'
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- 休憩時間の計算（複数回の休憩に対応）
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (
      COALESCE(be.recorded_at, NOW()) - bs.recorded_at
    )) / 60
  ), 0)::INTEGER INTO v_break_minutes
  FROM attendance_records bs
  LEFT JOIN LATERAL (
    SELECT recorded_at
    FROM attendance_records
    WHERE employee_id = p_employee_id
      AND DATE(recorded_at AT TIME ZONE 'Asia/Tokyo') = p_work_date
      AND attendance_type = 'break_end'
      AND recorded_at > bs.recorded_at
    ORDER BY recorded_at ASC
    LIMIT 1
  ) be ON true
  WHERE bs.employee_id = p_employee_id
    AND DATE(bs.recorded_at AT TIME ZONE 'Asia/Tokyo') = p_work_date
    AND bs.attendance_type = 'break_start';

  -- 実働時間の計算
  IF v_clock_in IS NOT NULL AND v_clock_out IS NOT NULL THEN
    v_work_minutes := GREATEST(0,
      (EXTRACT(EPOCH FROM (v_clock_out - v_clock_in)) / 60)::INTEGER - v_break_minutes
    );

    -- 残業時間の計算
    v_overtime_minutes := GREATEST(0, v_work_minutes - v_standard_work_minutes);

    -- 深夜時間の計算（22:00-05:00）
    -- 簡易計算：退勤が22時以降の場合
    IF EXTRACT(HOUR FROM v_clock_out AT TIME ZONE 'Asia/Tokyo') >= 22 THEN
      v_late_night_minutes := LEAST(
        v_work_minutes,
        (EXTRACT(EPOCH FROM (v_clock_out - (p_work_date + INTERVAL '22 hours'))) / 60)::INTEGER
      );
    END IF;
  END IF;

  -- daily_attendancesにUPSERT
  INSERT INTO daily_attendances (
    employee_id, work_date, clock_in, clock_out,
    break_minutes, actual_work_minutes, overtime_minutes, late_night_minutes,
    status
  ) VALUES (
    p_employee_id, p_work_date, v_clock_in, v_clock_out,
    v_break_minutes, v_work_minutes, v_overtime_minutes, v_late_night_minutes,
    CASE
      WHEN v_clock_in IS NOT NULL THEN 'present'
      ELSE 'absent'
    END
  )
  ON CONFLICT (employee_id, work_date)
  DO UPDATE SET
    clock_in = EXCLUDED.clock_in,
    clock_out = EXCLUDED.clock_out,
    break_minutes = EXCLUDED.break_minutes,
    actual_work_minutes = EXCLUDED.actual_work_minutes,
    overtime_minutes = EXCLUDED.overtime_minutes,
    late_night_minutes = EXCLUDED.late_night_minutes,
    status = EXCLUDED.status,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 打刻時に自動で日次勤怠を更新するトリガー
CREATE OR REPLACE FUNCTION trigger_update_daily_attendance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_daily_attendance(
    NEW.employee_id,
    DATE(NEW.recorded_at AT TIME ZONE 'Asia/Tokyo')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_record_after_insert
  AFTER INSERT ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION trigger_update_daily_attendance();

-- 残業アラート対象者取得関数
CREATE OR REPLACE FUNCTION get_overtime_alert_employees(
  p_month DATE,
  p_threshold_minutes INTEGER DEFAULT 2700 -- 45時間 = 2700分
)
RETURNS TABLE (
  employee_id UUID,
  employee_name VARCHAR,
  department_name VARCHAR,
  total_overtime_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    d.name,
    COALESCE(SUM(da.overtime_minutes), 0)::INTEGER
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  LEFT JOIN daily_attendances da ON e.id = da.employee_id
    AND DATE_TRUNC('month', da.work_date) = DATE_TRUNC('month', p_month)
  WHERE e.is_active = true
  GROUP BY e.id, e.name, d.name
  HAVING COALESCE(SUM(da.overtime_minutes), 0) >= p_threshold_minutes
  ORDER BY COALESCE(SUM(da.overtime_minutes), 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 有休取得率低下アラート対象者取得関数
CREATE OR REPLACE FUNCTION get_leave_alert_employees(
  p_fiscal_year INTEGER,
  p_min_usage_days DECIMAL DEFAULT 5.0
)
RETURNS TABLE (
  employee_id UUID,
  employee_name VARCHAR,
  department_name VARCHAR,
  granted_days DECIMAL,
  used_days DECIMAL,
  remaining_days DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    d.name,
    lb.granted_days,
    lb.used_days,
    lb.remaining_days
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  LEFT JOIN leave_balances lb ON e.id = lb.employee_id
    AND lb.fiscal_year = p_fiscal_year
    AND lb.leave_type = 'paid'
  WHERE e.is_active = true
    AND lb.used_days < p_min_usage_days
  ORDER BY lb.used_days ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
