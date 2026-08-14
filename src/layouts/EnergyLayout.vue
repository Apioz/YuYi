<template>
  <div class="yy-energy-layout">
    <AppHeader @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />

    <div class="yy-energy-body">
      <LeftMenu :collapsed="sidebarCollapsed" />

      <div class="yy-energy-main">
        <div class="yy-tabbar">
          <div class="yy-tabs-wrap">
            <div
              v-for="tab in tabs"
              :key="tab.path"
              class="yy-tab-item"
              :class="{ 'is-active': tab.path === activePath }"
              @click="switchTab(tab.path)"
            >
              <span class="yy-tab-label">{{ tab.title }}</span>
              <button
                v-if="tab.closable"
                type="button"
                class="yy-tab-close"
                aria-label="关闭标签"
                @click.stop="closeTab(tab.path)"
              >
                ×
              </button>
            </div>
          </div>
          <PlatformSwitcher />
        </div>

        <main class="yy-content">
          <router-view v-slot="{ Component }">
            <component :is="Component" v-if="Component" :key="route.fullPath" />
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import LeftMenu from '@/components/layout/LeftMenu.vue'
import PlatformSwitcher from '@/components/layout/PlatformSwitcher.vue'
import { appRouteTitleMap } from '@/config/menu'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)

const activePath = computed(() => route.path)

const tabs = ref([{ path: '/energy/reports', title: '能源报表', closable: true }])

watch(
  () => route.path,
  (path) => {
    const title = appRouteTitleMap[path] || route.meta.title
    if (!title) return
    if (!tabs.value.some((t) => t.path === path)) {
      tabs.value.push({
        path,
        title,
        closable: path !== '/energy/reports'
      })
    }
  },
  { immediate: true }
)

function switchTab(path) {
  router.push(path)
}

function closeTab(path) {
  const idx = tabs.value.findIndex((t) => t.path === path)
  if (idx === -1) return
  const nextTabs = tabs.value.filter((t) => t.path !== path)
  tabs.value = nextTabs
  if (route.path === path) {
    const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0]
    if (fallback) router.push(fallback.path)
  }
}
</script>

<style scoped>
.yy-energy-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--yy-bg-page);
}

.yy-energy-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.yy-energy-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.yy-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--yy-bg-white);
  border-bottom: 1px solid var(--yy-border);
  padding-right: 12px;
  flex-shrink: 0;
  min-height: 40px;
}

.yy-tabs-wrap {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 0 8px;
}

.yy-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--yy-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  user-select: none;
}

.yy-tab-item:hover {
  color: var(--yy-primary);
}

.yy-tab-item.is-active {
  color: var(--yy-primary);
  border-bottom-color: var(--yy-primary);
}

.yy-tab-close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  opacity: 0.6;
}

.yy-tab-close:hover {
  opacity: 1;
}

.yy-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  background: var(--yy-bg-page);
}
</style>
