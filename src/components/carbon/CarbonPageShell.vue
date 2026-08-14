<template>
  <div class="carbon-page">
    <div class="carbon-page-toolbar">
      <nav class="carbon-breadcrumb" aria-label="面包屑">
        <span>能源管理平台</span>
        <span>/</span>
        <span>碳管理</span>
        <span>/</span>
        <span class="is-current">{{ pageTitle }}</span>
      </nav>
      <div class="carbon-toolbar-actions">
        <el-select v-model="year" size="default" style="width: 120px">
          <el-option label="2024年度" value="2024" />
          <el-option label="2023年度" value="2023" />
        </el-select>
        <el-button>导出报告</el-button>
      </div>
    </div>
    <div class="carbon-page-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  pageTitle: { type: String, required: true }
})

const year = ref('2024')
</script>

<style scoped>
.carbon-page-body {
  min-height: 0;
}
</style>
