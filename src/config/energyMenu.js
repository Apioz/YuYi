/**
 * 能源管理 — 侧边栏菜单（严格按平台截图 + 三级菜单详情图）
 * 二级菜单来自主界面截图，三级菜单来自菜单详情截图
 */
export const ENERGY_ROUTE_PREFIX = '/energy'

export const energyMenuTree = [
  {
    id: 'energy',
    name: '能源管理',
    children: [
      { id: 'energy-reports', name: '能源报表', path: '/energy/reports' },
      {
        id: 'energy-stats',
        name: '能耗统计',
        children: [
          { id: 'energy-overview', name: '能源总览', path: '/energy/statistics/overview' },
          { id: 'energy-flow', name: '能源流向分析', path: '/energy/statistics/flow' }
        ]
      },
      {
        id: 'energy-power-analysis',
        name: '电能分析',
        children: [
          { id: 'power-overview', name: '电能概况', path: '/energy/power-analysis/overview' },
          { id: 'yoy-analysis', name: '同比分析', path: '/energy/power-analysis/yoy' },
          { id: 'mom-analysis', name: '环比分析', path: '/energy/power-analysis/mom' },
          { id: 'power-trend', name: '电能趋势', path: '/energy/power-analysis/trend' },
          { id: 'power-flow', name: '电能流向', path: '/energy/power-analysis/flow' },
          { id: 'loss-analysis', name: '损耗分析', path: '/energy/power-analysis/loss' },
          { id: 'sub-overview', name: '分项概况', path: '/energy/power-analysis/sub-overview' },
          { id: 'meter-info', name: '表计信息', path: '/energy/power-analysis/meter-info' },
          { id: 'power-topology', name: '用电拓扑', path: '/energy/power-analysis/topology' }
        ]
      },
      {
        id: 'energy-power-devices',
        name: '电能设备管理',
        children: [
          { id: 'cabinet', name: '电柜管理', path: '/energy/power-devices/cabinet' },
          { id: 'meter', name: '电表管理', path: '/energy/power-devices/meter' },
          { id: 'upstream', name: '上下游关系管理', path: '/energy/power-devices/upstream' },
          { id: 'peak-rule', name: '电表峰值规则设置', path: '/energy/power-devices/peak-rule' },
          { id: 'instrument-data', name: '仪表数据', path: '/energy/power-devices/instrument-data' }
        ]
      },
      { id: 'energy-efficiency', name: '能效分析管理', path: '/energy/efficiency' },
      {
        id: 'energy-water-devices',
        name: '水能设备管理',
        children: [
          { id: 'water-meter', name: '水表管理', path: '/energy/water-devices/meter' },
          { id: 'water-upstream', name: '水表上下游关系管理', path: '/energy/water-devices/upstream' }
        ]
      },
      { id: 'energy-levels', name: '能源层级管理', path: '/energy/levels' },
      {
        id: 'energy-alarm',
        name: '报警中心',
        children: [
          { id: 'threshold', name: '阈值设置', path: '/energy/alarm/threshold' },
          { id: 'event-alarm', name: '能源事件告警', path: '/energy/alarm/events' }
        ]
      }
    ]
  }
]

/** 收集所有叶子路由 path → title */
export function buildEnergyRouteTitleMap(tree = energyMenuTree) {
  const map = {}
  function walk(nodes) {
    for (const node of nodes) {
      if (node.path) {
        map[node.path] = node.name
      }
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(tree)
  return map
}

/** 收集所有叶子路由 */
export function collectEnergyLeafRoutes(tree = energyMenuTree) {
  const routes = []
  function walk(nodes) {
    for (const node of nodes) {
      if (node.path) {
        routes.push({ path: node.path, name: node.name, id: node.id })
      }
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(tree)
  return routes
}

/** 能源管理菜单默认全部收起，不随路由自动展开 */
export function getEnergyOpenKeys() {
  return []
}

export const energyRouteTitleMap = buildEnergyRouteTitleMap()
