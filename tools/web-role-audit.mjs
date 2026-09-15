// Web 端角色权限实测：管理员全菜单 / 教练受限菜单 / 家长被拒
// 使用后端托管的构建产物（3001，与 web-flow-audit 一致），避免与其它占用 3000 的服务冲突
// 注：导航已改为 Hub 聚合设计（7 个顶级菜单），断言按当前设计编写；
//     教练身份文案跟随机构称呼方案（默认 edu 方案渲染为「老师」），选择器按位置命中
import path from 'node:path';
import { launchBrowser } from './browser.mjs'
const __ROOT = (() => {
  const p = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  return p;
})();

const base = 'http://localhost:3001'
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const results = []

async function step(name, fn) {
  try { await fn(); results.push(`✓ ${name}`) }
  catch (e) { results.push(`✗ ${name}: ${String(e).slice(0, 140)}`) }
}

// 退出当前会话，回到干净的登录态
async function logout() {
  await page.goto(base + '/login', { waitUntil: 'networkidle' })
  await page.evaluate(() => { localStorage.clear() })
  await page.goto(base + '/login', { waitUntil: 'networkidle' })
}

// roleIndex: 0=管理员 1=教练(文案随称呼方案变化，按位置命中)
async function login(phone, roleIndex, password) {
  await logout()
  await page.fill('input[placeholder="请输入手机号"]', phone)
  await page.locator('.role-chip').nth(roleIndex).click()
  await page.fill('input[placeholder="请输入登录密码"]', password || '123456')
  await page.click('button:has-text("登 录")')
}

// 1. 登录页无"家长"选项（Web 管理端面向机构员工）
await step('登录页仅员工身份选项', async () => {
  await page.goto(base + '/login', { waitUntil: 'networkidle' })
  const chips = await page.locator('.role-chip').allTextContents()
  if (chips.some((t) => t.includes('家长'))) throw new Error('登录页仍显示家长选项')
  if (!chips.some((t) => t.includes('管理员'))) throw new Error('缺少管理员选项')
  if (!chips.some((t) => /教练|老师/.test(t))) throw new Error('缺少教练选项: ' + JSON.stringify(chips))
})

// 2. 管理员登录：Hub 级全菜单 + 设置入口
await step('管理员登录-全菜单', async () => {
  await login('13800000001', 0)
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await page.waitForSelector('.sidebar-menu .el-menu-item', { timeout: 8000 })
  const items = await page.locator('.sidebar-menu .el-menu-item').allTextContents()
  if (items.length < 5) throw new Error(`管理员菜单项过少: ${items.length}`)
  for (const need of ['教学运营', '系统设置']) {
    if (!items.some((t) => t.includes(need))) throw new Error(`管理员缺少菜单: ${need}`)
  }
  // 验证用户下拉含"系统设置"入口（仅管理员）
  await page.click('.user-trigger')
  await page.waitForTimeout(500)
  const settingsEntry = await page.locator('.el-dropdown-menu__item', { hasText: '系统设置' }).count()
  if (settingsEntry === 0) throw new Error('管理员缺少系统设置入口')
  await page.keyboard.press('Escape')
})

// 3. 教练登录：受限菜单 + 首页跳教学运营（排期 tab）
await step('教练登录-受限菜单', async () => {
  await login('13800000011', 1)
  await page.waitForURL('**/operations**', { timeout: 10000 })
  await page.waitForSelector('.sidebar-menu .el-menu-item', { timeout: 8000 })
  const items = await page.locator('.sidebar-menu .el-menu-item').allTextContents()
  const hasOps = items.some((t) => t.includes('教学运营'))
  const hasSettings = items.some((t) => t.includes('系统设置'))
  const hasSales = items.some((t) => t.includes('销售'))
  if (!hasOps) throw new Error('教练缺少教学运营菜单')
  if (hasSettings || hasSales) throw new Error(`教练菜单越权: ${items.join(',')}`)
})

// 4. 教练访问 /settings 被重定向（路由守卫按角色/权限拦截）
await step('教练访问系统设置被拦截', async () => {
  await page.goto(base + '/settings', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const url = page.url()
  if (!url.includes('/operations') && !url.includes('/schedule')) throw new Error(`未重定向，当前: ${url}`)
})

// 5. 家长登录被拒
await step('家长登录被拒', async () => {
  await logout()
  await page.fill('input[placeholder="请输入手机号"]', '13900000001')
  await page.locator('.role-chip').first().click()
  await page.fill('input[placeholder="请输入登录密码"]', '123456')
  await page.click('button:has-text("登 录")')
  await page.waitForTimeout(1500)
  const err = await page.locator('.el-message--error').count()
  if (err === 0) throw new Error('家长登录未提示错误')
})

await browser.close()
console.log(results.join('\n'))
process.exit(results.some((r) => r.startsWith('✗')) ? 1 : 0)
