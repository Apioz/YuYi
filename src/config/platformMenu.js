/** 平台切换菜单 — 右上角「更多」下拉 */
export const platformSwitcherSections = [
  {
    id: 'frontend',
    label: '前台',
    items: []
  },
  {
    id: 'mid-platform',
    label: '中台',
    items: [
      { id: 'asset', label: '资产管理', path: '/platform/asset' },
      { id: 'operation', label: '运营管理', path: '/platform/operation' },
      { id: 'energy', label: '能源管理', path: '/energy/reports', current: true },
      { id: 'property', label: '物业管理', path: '/platform/property' },
      { id: 'security', label: '安全管理', path: '/platform/security' },
      { id: 'ai-group', label: '智能群体管理', path: '/platform/ai-group' }
    ]
  },
  {
    id: 'base',
    label: '底座',
    items: []
  }
]

/** 当前中台标题 */
export const currentPlatformTitle = '禹翼数字化管理平台-能源管理'

/** 项目选项 */
export const projectOptions = [{ id: 'igus', name: 'igus项目' }]
