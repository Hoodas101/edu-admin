# 更新日志（Changelog）

本项目所有值得注意的变更都记录在此文件。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-09-11

首个公开发布版本（合并自 edu-admin-system 的能力与 edu-admin 完整三端）。

### 新增

- 管理后台深色模式：跟随系统 / 浅色 / 深色三档切换（顶栏按钮），
  偏好持久化到 localStorage，首屏无闪白；ECharts 与课程标识色随主题重绘
- `tools/dark-mode-audit.mjs`：像素级深浅色双模式审计（--theme dark|light）
- Docker 一键部署：单镜像（API + 管理后台）、compose 编排、
  Caddy 自动 HTTPS 边车、`deploy/deploy.sh` 与 GitHub Actions Deploy 工作流
- CI（GitHub Actions）：后端 4 个专项套件 × Node 18/20/22（256 项全量回归
  为本地门禁 `npm run test:backend`）、
  管理端构建、镜像构建冒烟、敏感信息与运行数据门禁
- 社区文档：贡献指南、安全策略、行为准则
- 微信小程序三端（家长 / 教练 / 管理员，41 页原生实现）
- Express + SQLite 后端：JWT 鉴权、按 IP 限流、CORS 来源控制、审计日志
- 业务模块：成员、课程、排期、班级、签到、会员卡、积分、订单与微信支付、
  财务与薪资、线索/跟进、成长记录、意见反馈、请假与补课
- 定时任务：续费/余额/开课提醒、自动缺席标记、数据库自动备份、异步任务队列
- Vue 3 + Element Plus 管理后台：数据看板、排课看板、签到、会员与财务、
  系统设置
- 一键部署 `deploy.sh`（免 Docker 原生路径）+ 全中文文档
  （README / 使用手册 / 部署上线说明 / 常见问题 FAQ / TEST-GUIDE）
- 可定制机构称呼（老师/学员/会员全站替换），全部业务规则可配置
- JWT 安全：未配置 `JWT_SECRET` 时首次启动自动生成强随机密钥并持久化
  （`backend/db/.jwt-secret`，随数据库备份），绝不使用硬编码默认值；
  每日自动备份 + Web 一键导出

## [Unreleased] - 2026-09-14

多视角深度审计（机构管理者 / 教练 / 销售 / 家长 / 工程师 / 设计师）后的四批修复。

### 安全 Security

- 家长手机号免密登录改为环境变量开关 `PARENT_PHONE_LOGIN`（生产默认关闭），
  堵住账号接管面；微信一键登录路径不受影响
- JWT 增加 `token_version` 吊销链：停用 / 改密 / 角色变更 / 删除员工即时作废旧 Token
  （全员需重新登录一次，为本次安全升级的预期代价）
- 签到套利修复：家长扫码补报名校验、次数卡扣课、QR nonce 验证
- 越权修复：排期 PUT 归属校验、他人学员名册裁剪、/charts 权限、微信支付订单归属、
  `INSERT OR REPLACE` 覆盖支付记录去除
- 部署安全：seed 三重守卫（`seed.js` 非空库需 `--force`、`deploy/deploy.sh` 检测
  有数据即跳过、Deploy 工作流 `seed_demo_data` 默认 false）——重跑部署不再清空生产库；
  `remote-deploy.sh` 保留 `.env`（JWT_SECRET 不再随重部署重置全员掉线）

### 修复 Fixed

- 财务口径统一：summary/monthly/by-product/by-sales 收入均改计 `status IN ('paid','refunded')`
  且排除 `order_type='refund'` 流水行 —— 修复全额退款订单（status 翻转）收入消失、
  退款照扣导致的净收入双扣为负，以及两套报表互相矛盾；新增离线回归套件
  `tests/finance-refund-regression.cjs`（21 项，入 npm test 与 CI）
- 退卡金额：按订单实付/原价比例折减整单折扣（原按标价退对折扣单超退），
  并加「订单剩余额退度」硬上限（payable − 已退），与订单退款路径口径一致；
  RFND 流水 order_no 补随机后缀（同毫秒连退两卡撞 UNIQUE 约束实测）
- 资金正确性：退卡按 `unitPrice` 找价（原按 `price` 永不命中导致超退）、
  退款金额上限与 refund_rules 复算、取消订单多步回滚入事务、会员编号漂移修复
- 一致性：课时/积分/扣卡/分班等 12 处读改写补事务边界；备份目录跟随 `DB_PATH`
  （Docker 卷内不再落可写层丢失）；health 加 `SELECT 1` 真实探测；
  微信支付未配置时诚实失败而非假成功；`allow_self_booking` 开关落地
- 薪资：新增 `POST /api/payroll/settle` 按月结算写入 `payroll_logs`
  （财务净利润不再把课酬当 0 虚高），配套 /logs /void 与前端「确认结算 / 结算记录 / 作废」；
  结算确认弹窗人数改按「金额 > 0 的教练」计（与后端跳过 0 元记录的口径一致，不再虚报）
- 薪资结算流程可懂性：作废弹窗提示「该月剩余 N 条需全部作废方可重算」；月份列与页内
  其它区域统一「2026年09月」格式；已作废记录结算时间显示「—」不再回落创建时间；
  「净利润虚高」警示从灰色小字升级为独立 warning 提示条
- 登录/掉线边角：`/login?redirect=/login` 不再停在登录页；并发 401 只提示跳转一次；
  重登跳到无权限页时给出明确 toast（不再静默弹回让人以为页面坏了）
- CI 阻断修复：`p2-fixes` 套件补 seed 夹具自举双模式（旧版 CI 空库下身份解析不到，
  403 + 外键崩溃三矩阵全红，对抗审查在干净 worktree 实测复现）
- 部署加固：`--fresh-db` 连 `-wal/-shm` 一起删（防旧数据经 WAL 回灌致守卫误判跳过 seed）；
  `remote-deploy.sh` 的 .env 备份改 mktemp 随机路径 + 0600 权限 + trap 兜底恢复；
  Deploy 工作流完成通知不再无条件展示示例账号（存量库沿用原账号）；
  `seed.js` 头注释与守卫行为对账；CHANGELOG「移除」段改写为如实描述（本地清理非仓库删除）

### 变更 Changed

- 管理后台 Element Plus 改按需引入（自定义 unplugin 解析器绕开 barrel tree-shaking 陷阱）：
  element-plus chunk 1060→584 kB、CSS 352→221 kB；xlsx 499 kB 改动态加载
- 前端菜单过滤与路由守卫统一 `hasPageAccess` 判定；404 catch-all；
  401 掉线带 `redirect` 回跳原页；登出清全部身份缓存
- CI 纳入 `p2-fixes` / `finance-refund-regression` 与全功能 256 项套件（共 6 个专项套件；
  CI 空库自动以 seed 夹具自举，本地仍优先使用真实库快照）；根目录新增统一入口 `npm test`
- `.env.example` 补 `PARENT_PHONE_LOGIN` / `STAFF_DEFAULT_PASSWORD` 说明

### 移除 Removed

- 本地工作区清理（下列文件本就未被 git 跟踪，仓库无对应删除记录）：
  旧代脚本 `start.sh` / `stop.sh`（由 `start-all.sh` / `stop-all.sh` 取代）、
  CloudBase 遗物 `seed-data.js` / `init-cloud.js` / `deploy-functions.sh` 从开发机移除；
  根目录散落的 10 份 AUDIT/QA 历史报告移入 `docs/archive/`（`.gitignore` 覆盖）


<!--

### 变更 Changed
### 废弃 Deprecated
### 移除 Removed
### 修复 Fixed
### 安全 Security

-->
