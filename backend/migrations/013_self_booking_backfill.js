/**
 * 迁移 013：allow_self_booking 语义落地前的数据对齐
 *
 * 背景：schedules.allow_self_booking 此前只写不读（开关失效）。
 * 列默认值为 0，而历史行为是「家长均可自助报名」——若直接按 0=关闭执行，
 * 全部存量排期的家长报名会被误关。本迁移把存量行统一置 1（保持现状），
 * 此后管理员可在排期中显式关闭自助报名，路由开始真实执行该开关。
 */
function up(db) {
  db.prepare('UPDATE schedules SET allow_self_booking = 1 WHERE allow_self_booking = 0 OR allow_self_booking IS NULL').run();
}

module.exports = { up };
