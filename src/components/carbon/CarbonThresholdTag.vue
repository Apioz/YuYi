<template>
  <el-tag :type="tagType" size="small" effect="light">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const tagType = computed(() => {
  if (props.status === '超上限') return 'danger'
  if (props.status === '超下限') return 'warning'
  return 'success'
})

const label = computed(() => props.status)
</script>
