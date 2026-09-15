import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import path from 'path'
import { readdirSync, readFileSync, existsSync } from 'fs'

// ============================================================
// Element Plus 真·按需引入
// unplugin 官方 ElementPlusResolver 的 import 源是 barrel（element-plus/es），
// 而 barrel 的 defaults.mjs 安装器链引用了全部组件、阻断 tree-shaking
// （实测打包后 tour/carousel/watermark 等未用组件仍在 chunk 里）。
// 这里改为解析到 element-plus/es/components/<dir>/index.mjs 独立入口 + 样式注入。
// ============================================================
const EP_COMPONENTS_DIR = path.resolve(__dirname, 'node_modules/element-plus/es/components')

function buildComponentDirMap() {
  const map = {}
  for (const dir of readdirSync(EP_COMPONENTS_DIR)) {
    const idx = path.join(EP_COMPONENTS_DIR, dir, 'index.mjs')
    if (!existsSync(idx)) continue
    const src = readFileSync(idx, 'utf8')
    for (const m of src.matchAll(/\b(El[A-Z][A-Za-z0-9]*)\b/g)) {
      if (!(m[1] in map)) map[m[1]] = dir
    }
  }
  return map
}

const EP_DIR = buildComponentDirMap()

const epSideEffects = (dir) => [
  'element-plus/es/components/base/style/css',
  `element-plus/es/components/${dir}/style/css`
]

function ElementPlusOndemandResolver() {
  return [
    {
      type: 'component',
      resolve: (name) => {
        const dir = EP_DIR[name]
        if (!dir) return
        return { name, from: `element-plus/es/components/${dir}/index.mjs`, sideEffects: epSideEffects(dir) }
      }
    },
    {
      // 指令：v-loading（项目仅用到这一个）
      type: 'directive',
      resolve: (name) => {
        if (name !== 'Loading') return
        return {
          name: 'ElLoadingDirective',
          from: 'element-plus/es/components/loading/index.mjs',
          sideEffects: epSideEffects('loading')
        }
      }
    }
  ]
}

// Vite 配置
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Element Plus API（ElMessage / ElMessageBox 等，样式随组件注入）
    AutoImport({
      resolvers: [ElementPlusOndemandResolver()]
    }),
    // 按需注册 Element Plus 组件与指令（v-loading 等），样式自动注入
    Components({
      resolvers: [ElementPlusOndemandResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        // 本地 Node.js 后端（Express + SQLite）
        // 注意：不再 rewrite 掉 /api 前缀，后端路由就是 /api/{resource}/{action}
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入变量文件
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 大依赖独立分包：利用浏览器缓存 + 并行加载，加快首屏
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) {
            return 'echarts'
          }
          if (id.includes('node_modules/element-plus') || id.includes('node_modules/@element-plus')) {
            return 'element-plus'
          }
          if (
            id.includes('node_modules/vue') ||
            id.includes('node_modules/pinia') ||
            id.includes('node_modules/vue-router') ||
            id.includes('node_modules/dayjs') ||
            id.includes('node_modules/axios')
          ) {
            return 'vendor'
          }
        },
      },
    },
  }
})
