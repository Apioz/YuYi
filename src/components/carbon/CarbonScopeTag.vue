<script setup>
import { computed } from 'vue'

const props = defineProps({
  scope: { type: String, default: '' }
})

const tagType = computed(() => {
  if (props.scope === 'Scope 1') return 'warning'
  if (props.scope === 'Scope 2') return 'primary'
  if (props.scope === 'Scope 3') return 'info'
  return 'info'
})
</script>

<template>
  <el-tag :type="tagType" size="small" effect="light">{{ scope }}</el-tag>
</template>
