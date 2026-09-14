/**
 * 迁移 011：收编散落在各路由文件 require 时执行的 try{ALTER}catch 列
 *
 * 背景：历史上约 40 处 `try { ALTER TABLE ... } catch {}` 分散在 routes/*.js 顶部，
 * 导致 migrations/001-010 不再是权威 schema，新库与老库演进路径不同源。
 * 本迁移把全部列收编进幂等账本（_migrations），路由文件中的散落 ALTER 同步删除。
 * 全部使用 safeAddColumn 幂等模式：新库/老库/半迁移库均可安全执行。
 */

function safeAddColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function up(db) {
  // users / teachers（auth.js、admin.js、payroll.js）
  safeAddColumn(db, 'users', 'alias', "TEXT DEFAULT ''");
  safeAddColumn(db, 'users', 'permissions', "TEXT DEFAULT ''");
  safeAddColumn(db, 'teachers', 'alias', "TEXT DEFAULT ''");
  safeAddColumn(db, 'teachers', 'class_fee', 'REAL DEFAULT 0');
  safeAddColumn(db, 'teachers', 'pay_rule', 'TEXT');
  // courses / students（admin.js、students.js）
  safeAddColumn(db, 'courses', 'archived', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'students', 'member_no', "TEXT DEFAULT ''");
  safeAddColumn(db, 'students', 'archived', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'students', 'qr_exp', 'INTEGER DEFAULT 0');
  // orders（orders.js）
  safeAddColumn(db, 'orders', 'refunded_amount', 'REAL DEFAULT 0');
  safeAddColumn(db, 'orders', 'salesperson', "TEXT DEFAULT ''");
  safeAddColumn(db, 'orders', 'remark', "TEXT DEFAULT ''");
  safeAddColumn(db, 'orders', 'is_1v1', 'INTEGER DEFAULT 0');
  // notifications（messages.js）
  safeAddColumn(db, 'notifications', 'priority', "TEXT DEFAULT 'normal'");
  safeAddColumn(db, 'notifications', 'summary', "TEXT DEFAULT ''");
  safeAddColumn(db, 'notifications', 'category', "TEXT DEFAULT 'system'");
  safeAddColumn(db, 'notifications', 'is_broadcast', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'notifications', 'group_name', "TEXT DEFAULT ''");
  // member_cards / membership_cards（membership.js）
  safeAddColumn(db, 'member_cards', 'paused_at', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'member_cards', 'pause_total_ms', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'member_cards', 'pause_reason', "TEXT DEFAULT ''");
  safeAddColumn(db, 'member_cards', 'billing_mode', "TEXT DEFAULT 'time'");
  safeAddColumn(db, 'membership_cards', 'billing_mode', "TEXT DEFAULT 'time'");
  safeAddColumn(db, 'membership_cards', 'points_reward', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'membership_cards', 'product_type', "TEXT DEFAULT 'membership'");
  safeAddColumn(db, 'membership_cards', 'unit', "TEXT DEFAULT ''");
  safeAddColumn(db, 'membership_cards', 'description', "TEXT DEFAULT ''");
  // enrollments / schedule_rules / schedules（schedules.js）
  safeAddColumn(db, 'enrollments', 'created_by', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedule_rules', 'repeat_type', "TEXT DEFAULT 'weekly'");
  safeAddColumn(db, 'schedule_rules', 'interval_days', 'INTEGER DEFAULT 1');
  safeAddColumn(db, 'schedule_rules', 'group_course_id', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedule_rules', 'group_name', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedules', 'group_course_id', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedules', 'group_name', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedules', 'class_name', "TEXT DEFAULT ''");
  safeAddColumn(db, 'schedules', 'duration_minutes', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'schedules', 'allow_self_booking', 'INTEGER DEFAULT 0');
  safeAddColumn(db, 'schedules', 'student_ids', "TEXT DEFAULT ''");
}

module.exports = { up };
