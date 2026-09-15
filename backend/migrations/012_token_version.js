/**
 * 迁移 012：JWT 吊销能力（token_version）
 *
 * 背景：JWT 签发后 7 天内无法吊销——管理员停用员工/重置密码/降级角色后，
 * 对方持有的旧 Token 仍然有效（权限残留窗口）。
 * 方案：users.token_version 计数；签发时写入 payload.tv；
 * 认证中间件比对 payload.tv 与库中值，不一致即 401。
 * 升级/停用/改密/重置密码时 bump 计数，强制该账号旧 Token 失效。
 *
 * 注：存量 Token 不含 tv 字段，与任意非空计数都不匹配 → 本迁移将所有账号计数置 1，
 * 使旧 Token 全员失效一次（安全升级的预期代价，用户重新登录后恢复）。
 */
function up(db) {
  const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!cols.includes('token_version')) {
    db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0');
  }
  // 置 1：使升级前签发的无 tv Token 全部失效
  db.prepare('UPDATE users SET token_version = 1 WHERE token_version = 0 OR token_version IS NULL').run();
}

module.exports = { up };
