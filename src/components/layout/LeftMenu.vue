<template>
  <aside class="yy-left-menu" :class="{ 'is-collapsed': collapsed }">
    <el-scrollbar class="yy-menu-scrollbar">
      <el-menu
        :key="menuRenderKey"
        :default-active="activePath"
        :default-openeds="openKeys"
        :collapse="collapsed"
        :collapse-transition="false"
        :unique-opened="false"
        class="yy-el-menu"
        background-color="#FFFFFF"
        text-color="rgba(0, 0, 0, 0.65)"
        active-text-color="#FFFFFF"
        @select="handleSelect"
      >
        <template v-for="root in appMenuTree" :key="root.id">
          <el-sub-menu :index="root.id" class="yy-root-submenu">
            <template #title>
              <MenuGridIcon />
              <span class="yy-menu-text">{{ root.name }}</span>
              <el-icon class="yy-expand-indicator"><ArrowRight /></el-icon>
            </template>

            <template v-for="item in root.children" :key="item.id">
              <el-sub-menu
                v-if="item.children?.length"
                :index="item.id"
                class="yy-second-level-submenu"
              >
                <template #title>
                  <MenuGridIcon />
                  <span class="yy-menu-text">{{ item.name }}</span>
                  <el-icon class="yy-expand-indicator"><ArrowRight /></el-icon>
                </template>
                <el-menu-item
                  v-for="leaf in item.children"
                  :key="leaf.id"
                  :index="leaf.path"
                  class="yy-third-level-item"
                >
                  <MenuGridIcon />
                  <template #title>{{ leaf.name }}</template>
                </el-menu-item>
              </el-sub-menu>

              <el-menu-item v-else :index="item.path" class="yy-second-level-leaf">
                <MenuGridIcon />
                <template #title>{{ item.name }}</template>
              </el-menu-item>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import MenuGridIcon from './MenuGridIcon.vue'
import { appMenuTree, getMenuOpenKeys } from '@/config/menu'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})
const { collapsed } = toRefs(props)

const route = useRoute()
const router = useRouter()

const activePath = computed(() => route.path)
const openKeys = computed(() => getMenuOpenKeys(route.path))
const menuRenderKey = computed(() => `${collapsed.value ? 'c' : 'e'}-${openKeys.value.join('|')}`)

function handleSelect(index) {
  if (typeof index === 'string' && index.startsWith('/')) {
    router.push(index)
  }
}
</script>

<style scoped>
.yy-left-menu {
  width: 210px;
  background: var(--yy-bg-white);
  border-right: 1px solid var(--yy-border);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.2s ease;
}

.yy-left-menu.is-collapsed {
  width: 0;
  border-right: none;
}

.yy-menu-scrollbar {
  height: 100%;
}

:deep(.yy-el-menu) {
  border-right: none;
  padding: 8px 0;
}

:deep(.yy-el-menu .el-menu-item),
:deep(.yy-el-menu .el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  margin: 2px 8px;
  width: calc(100% - 16px);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

:deep(.yy-el-menu .el-sub-menu__title) {
  padding-right: 12px !important;
}

.yy-menu-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yy-expand-indicator {
  flex-shrink: 0;
  margin-left: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.2s ease;
}

:deep(.yy-root-submenu.is-opened > .el-sub-menu__title .yy-expand-indicator),
:deep(.yy-second-level-submenu.is-opened > .el-sub-menu__title .yy-expand-indicator) {
  transform: rotate(90deg);
}

:deep(.yy-second-level-leaf .el-sub-menu__icon-arrow),
:deep(.yy-third-level-item .el-sub-menu__icon-arrow) {
  display: none;
}

:deep(.yy-root-submenu > .el-sub-menu__title .el-sub-menu__icon-arrow),
:deep(.yy-second-level-submenu > .el-sub-menu__title .el-sub-menu__icon-arrow) {
  display: none;
}

:deep(.yy-el-menu .el-menu-item:hover),
:deep(.yy-el-menu .el-sub-menu__title:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
  color: var(--yy-text-primary) !important;
}

:deep(.yy-el-menu .el-menu-item.is-active) {
  background-color: var(--yy-primary) !important;
  color: #fff !important;
}

:deep(.yy-el-menu .el-menu-item.is-active .menu-grid-icon i) {
  background: #fff;
}

:deep(.yy-el-menu .el-sub-menu .el-menu-item) {
  min-width: auto;
  padding-left: 48px !important;
}

:deep(.yy-el-menu .el-sub-menu .el-sub-menu .el-menu-item) {
  padding-left: 56px !important;
}

:deep(.yy-el-menu .yy-second-level-leaf) {
  padding-left: 20px !important;
}
</style>
