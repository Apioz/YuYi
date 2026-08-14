<template>
  <el-dropdown trigger="click" popper-class="yy-platform-dropdown" @command="handleCommand">
    <span class="yy-more-btn">更多</span>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-for="section in platformSwitcherSections" :key="section.id">
          <div class="yy-platform-section-label">{{ section.label }}</div>
          <el-dropdown-item
            v-for="item in section.items"
            :key="item.id"
            :command="item.path"
            :class="{ 'is-current': item.current }"
          >
            {{ item.label }}
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { platformSwitcherSections } from '@/config/platformMenu'

const router = useRouter()

function handleCommand(path) {
  if (path) {
    router.push(path)
  }
}
</script>

<style scoped>
.yy-more-btn {
  color: var(--yy-text-secondary);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  padding: 0 4px;
}

.yy-more-btn:hover {
  color: var(--yy-primary);
}
</style>

<style>
.yy-platform-dropdown .yy-platform-section-label {
  padding: 8px 16px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--yy-text-primary);
  cursor: default;
}

.yy-platform-dropdown .el-dropdown-menu__item.is-current {
  color: var(--yy-primary);
  font-weight: 500;
}

.yy-platform-dropdown .yy-platform-empty {
  color: var(--yy-text-placeholder);
}
</style>
