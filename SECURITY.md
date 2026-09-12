# 安全策略（Security Policy）

## 报告漏洞

发现安全问题请**不要开公开 Issue**，私下报告以便在披露前修复。
报告请包含：

- 漏洞简述
- 受影响组件（后端 API、Web 管理端、认证、支付、限流……）
- 复现步骤与最小触发环境
- 影响评估（数据泄露、提权、可用性……）

我们会确认收到、展开调查，并同步修复与发布进度。

## 安全模型

- **认证**：除公开的少数端点（`/api/auth/login`、`/api/auth/wx-login`、
  `/api/auth/phone-login`、`/api/health`、`/api/trial/apply`、`/api/wxpay/notify`、
  `/api/terms`）外，所有 `/api/*` 均需后端签发的 JWT。
  `GET /api/settings` 对未登录请求只返回登录页渲染所需的公开展示子集
  （机构名称/Logo/客服电话/称呼方案），积分、退费、请假、推送规则与表格列配置等
  经营数据仅在携带有效 JWT 时返回。
  `x-openid` 请求头永不作为身份来源被信任。
- **密钥**：代码中不存在任何硬编码默认密钥。`JWT_SECRET` 未通过环境变量
  配置时，服务首次启动会生成密码学随机密钥并持久化到 `backend/db/.jwt-secret`
  （已 git 忽略，随数据卷一起备份），此后一直复用 —— 任何版本都不会回退到
  可预测的公开值。多实例横向扩展时请显式设置共享的 `JWT_SECRET`。
  JWT 签名密钥与微信凭证（`WX_APPID` / `WX_SECRET` / `WX_MCH_ID` / `WX_MCH_KEY`）
  一律通过环境变量注入 —— 绝不提交进仓库。
- **限流**：`backend/server.js` 内置全局按 IP 限流（`RATE_MAX`，默认
  600 次/分钟）与登录按 IP 限流（`LOGIN_RATE_LIMIT`，默认 100 次/15 分钟）。
  公网部署建议收紧。
- **CORS**：`NODE_ENV=production` 下仅放行 `CORS_ORIGINS` 列出的来源。
- **数据库**：SQLite 文件位于 `backend/db/`，已被 git 忽略；
  生产数据库永不出现在仓库中。数据完全归属部署者本机，系统无任何云依赖。

## 范围

支持目标为最新 release tag 与 `main` 分支。三端微信小程序为可选付费扩展、
不在本仓库内——小程序端安全问题请联系扩展授权方单独报告，与后端相关的问题
（如接口越权影响小程序数据）仍按本流程报告。
