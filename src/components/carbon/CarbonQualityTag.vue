<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true }
})

const tagType = computed(() => {
  if (props.label === '实测') return 'success'
  if (props.label === '统计') return 'warning'
  if (props.label === '估算') return 'danger'
  return 'info'
})
</script>

<template>
  <el-tag :type="tagType" size="small" effect="light">{{ label }}</el-tag>
</template>
