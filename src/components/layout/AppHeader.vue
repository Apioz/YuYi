<template>
  <header class="yy-app-header">
    <div class="yy-app-header-left">
      <button
        type="button"
        class="yy-icon-btn"
        aria-label="切换菜单"
        @click="$emit('toggle-sidebar')"
      >
        <el-icon><Fold /></el-icon>
      </button>
      <span class="yy-system-title">{{ currentPlatformTitle }}</span>
    </div>

    <div class="yy-app-header-right">
      <el-select
        v-model="currentProjectId"
        class="yy-project-select"
        size="default"
      >
        <el-option
          v-for="p in projectOptions"
          :key="p.id"
          :label="p.name"
          :value="p.id"
        />
      </el-select>

      <el-tooltip content="主题" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="主题">
          <el-icon><Brush /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="锁屏" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="锁屏">
          <el-icon><Lock /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="刷新" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="刷新" @click="reload">
          <el-icon><Refresh /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="全屏" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="全屏" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="监控" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="监控">
          <el-icon><Monitor /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="消息" placement="bottom">
        <button type="button" class="yy-icon-btn" aria-label="消息">
          <el-icon><Bell /></el-icon>
        </button>
      </el-tooltip>

      <el-dropdown trigger="click">
        <div class="yy-user-info">
          <el-avatar :size="28" class="yy-user-avatar">管</el-avatar>
          <span class="yy-user-name">管理员</span>
          <el-icon class="yy-user-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import {
  ArrowDown,
  Bell,
  Fold,
  FullScreen,
  Lock,
  Monitor,
  Refresh,
  Brush
} from '@element-plus/icons-vue'
import { currentPlatformTitle, projectOptions } from '@/config/platformMenu'

defineEmits(['toggle-sidebar'])

const currentProjectId = ref(projectOptions[0]?.id ?? '')

function reload() {
  window.location.reload()
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}
</script>

<style scoped>
.yy-app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--yy-bg-white);
  border-bottom: 1px solid var(--yy-border);
  flex-shrink: 0;
}

.yy-app-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.yy-system-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--yy-text-primary);
  white-space: nowrap;
}

.yy-app-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.yy-project-select {
  width: 140px;
}

.yy-project-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding-left: 4px;
  padding-right: 4px;
}

.yy-project-select :deep(.el-input__inner) {
  text-align: right;
  color: var(--yy-text-primary);
}

.yy-icon-btn {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.yy-icon-btn:hover {
  color: var(--yy-primary);
}

.yy-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.yy-user-info:hover {
  background: rgba(0, 0, 0, 0.04);
}

.yy-user-avatar {
  background: var(--yy-primary);
  font-size: 12px;
}

.yy-user-name {
  font-size: 14px;
  color: var(--yy-text-primary);
}

.yy-user-arrow {
  font-size: 12px;
  color: var(--yy-text-placeholder);
}
</style>
