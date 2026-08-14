import { createRouter, createWebHistory } from 'vue-router'
import EnergyLayout from '@/layouts/EnergyLayout.vue'
import ModulePlaceholder from '@/views/ModulePlaceholder.vue'
import { collectAllLeafRoutes, appRouteTitleMap } from '@/config/menu'
import CarbonOverview from '@/views/carbon/CarbonOverview.vue'
import CarbonSources from '@/views/carbon/CarbonSources.vue'
import CarbonActivityData from '@/views/carbon/CarbonActivityData.vue'
import CarbonFactorLibrary from '@/views/carbon/CarbonFactorLibrary.vue'
import CarbonResults from '@/views/carbon/CarbonResults.vue'
import CarbonDataQuality from '@/views/carbon/CarbonDataQuality.vue'
import CarbonAnalysis from '@/views/carbon/CarbonAnalysis.vue'
import CarbonTargets from '@/views/carbon/CarbonTargets.vue'
import CarbonReports from '@/views/carbon/CarbonReports.vue'

const carbonPageMap = {
  '/carbon/overview': CarbonOverview,
  '/carbon/sources': CarbonSources,
  '/carbon/activity': CarbonActivityData,
  '/carbon/factors': CarbonFactorLibrary,
  '/carbon/results': CarbonResults,
  '/carbon/quality': CarbonDataQuality,
  '/carbon/analysis': CarbonAnalysis,
  '/carbon/targets': CarbonTargets,
  '/carbon/reports': CarbonReports
}

function resolveCarbonRoute(path, name) {
  const component = carbonPageMap[path]
  if (!component) {
    return {
      path: path.replace(/^\//, ''),
      name: path,
      component: ModulePlaceholder,
      meta: { title: name, subtitle: '页面内容待补充' }
    }
  }
  return {
    path: path.replace(/^\//, ''),
    name: path,
    component,
    meta: { title: name, isCarbon: true }
  }
}

const appRoutes = collectAllLeafRoutes().map(({ path, name }) => {
  if (path.startsWith('/carbon')) {
    return resolveCarbonRoute(path, name)
  }
  return {
    path: path.replace(/^\//, ''),
    name: path,
    component: ModulePlaceholder,
    meta: { title: name, subtitle: '页面内容待补充' }
  }
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: EnergyLayout,
      redirect: '/energy/reports',
      children: [
        ...appRoutes,
        {
          path: 'platform/:name',
          name: 'platform-placeholder',
          component: ModulePlaceholder,
          meta: { title: '平台切换', subtitle: '该平台模块待接入' }
        }
      ]
    }
  ]
})

export default router
export { appRouteTitleMap }
