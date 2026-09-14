<template>
  <!-- 中文语言包：按需引入后不再有全局 app.use(ElementPlus,{locale})，改由 ConfigProvider 提供 -->
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </el-config-provider>
</template>

<script setup>
// 根组件 - 路由视图、页面切换动画、全局语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
