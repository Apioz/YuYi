<template>
  <div class="module-placeholder">
    <div class="module-placeholder-inner">
      <div class="module-placeholder-icon">
        <span class="menu-grid-icon" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      </div>
      <h2 class="module-placeholder-title">{{ title }}</h2>
      <p class="module-placeholder-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title || '页面')
const subtitle = computed(() => route.meta.subtitle || '页面内容待补充')
</script>

<style scoped>
.module-placeholder {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yy-bg-white);
  border: 1px solid var(--yy-border);
}

.module-placeholder-inner {
  text-align: center;
  padding: 48px 24px;
}

.module-placeholder-icon {
  margin-bottom: 16px;
}

.module-placeholder-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--yy-text-primary);
}

.module-placeholder-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--yy-text-placeholder);
}

.menu-grid-icon {
  display: inline-grid;
  grid-template-columns: repeat(2, 5px);
  gap: 3px;
  width: 13px;
  height: 13px;
}

.menu-grid-icon i {
  display: block;
  width: 5px;
  height: 5px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 1px;
}
</style>
