import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Element Plus 按需引入：组件/指令/API 由 vite 的 unplugin 解析器自动注册并注入样式，
// 这里仅保留两件事——暗色变量表与基础图标字体（无 JS 注册，避免全量打包 1MB+）。
import 'element-plus/theme-chalk/dark/css-vars.css'

// 全局样式（含 .el-* 覆写，依赖组件样式已按页面注入，靠 CSS 变量生效与加载顺序无关）
import '@/styles/index.scss'

import App from './App.vue'
import router from './router'
import { useSettingsStore } from './store/settings'
import { initTheme } from './utils/theme'

// 主题引擎：跟随系统 / 强制浅色 / 强制深色（持久化 edu_theme，旧脏值自动归一）
initTheme()

const app = createApp(App)

// 注册路由
app.use(router)
// 注册 Pinia
app.use(createPinia())

// 统一称呼：全局 $t(key) / $roleLabel(role)，页面文案跟随机构方案
const settingsStore = useSettingsStore()
settingsStore.loadSettings()
app.config.globalProperties.$t = (key) => settingsStore.t(key)
app.config.globalProperties.$roleLabel = (role) => settingsStore.roleLabel(role)

app.mount('#app')
