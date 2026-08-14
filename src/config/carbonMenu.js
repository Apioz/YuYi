/** 碳管理 — 一级菜单及子页面（按截图） */
export const CARBON_ROUTE_PREFIX = '/carbon'

export const carbonMenuTree = [
  {
    id: 'carbon',
    name: '碳管理',
    children: [
      { id: 'carbon-overview', name: '碳核算总览', path: '/carbon/overview' },
      { id: 'carbon-sources', name: '排放源管理', path: '/carbon/sources' },
      { id: 'carbon-activity', name: '活动数据采集', path: '/carbon/activity' },
      { id: 'carbon-factors', name: '排放因子库', path: '/carbon/factors' },
      { id: 'carbon-results', name: '核算结果', path: '/carbon/results' },
      { id: 'carbon-quality', name: '数据质量', path: '/carbon/quality' },
      { id: 'carbon-analysis', name: '碳监测分析', path: '/carbon/analysis' },
      { id: 'carbon-targets', name: '碳目标管理', path: '/carbon/targets' },
      { id: 'carbon-reports', name: '碳报告中心', path: '/carbon/reports' }
    ]
  }
]

export function buildCarbonRouteTitleMap(tree = carbonMenuTree) {
  const map = {}
  function walk(nodes) {
    for (const node of nodes) {
      if (node.path) map[node.path] = node.name
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return map
}

export function collectCarbonLeafRoutes(tree = carbonMenuTree) {
  const routes = []
  function walk(nodes) {
    for (const node of nodes) {
      if (node.path) routes.push({ path: node.path, name: node.name, id: node.id })
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return routes
}

export function getCarbonOpenKeys(path) {
  if (path.startsWith('/carbon')) return ['carbon']
  return []
}

export const carbonRouteTitleMap = buildCarbonRouteTitleMap()
