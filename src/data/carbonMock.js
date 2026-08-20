export const parks = ['igus园区', '禹翼示范园', '仓储物流园']
export const landParcels = ['A区-烧成线', 'A区-烘干线', 'B区-动力站', 'C区-仓储', 'D区-行政办公', '全厂公共区域']
export const energyTypes = ['化石燃料', '外购电力', '外购热力', '过程排放', '移动源', '其他']

/** Scope 占比（用于按周期折算结构，基于年度结构） */
export const annualScopeRatios = {
  'Scope 1': 18520 / 19605,
  'Scope 2': 765 / 19605,
  'Scope 3': 320 / 19605
}

export const overviewKpis = [
  { label: '总排放量 (tCO₂e)', value: '19,605', unit: 't', trend: '↑ 3.2% 同比', color: '#1dbf73' },
  { label: 'Scope 1 直接排放', value: '18,520', unit: 't', trend: '↑ 2.8%', color: '#f5a623' },
  { label: 'Scope 2 间接排放', value: '765', unit: 't', trend: '↓ 5.1%', color: '#4a9eff' },
  { label: 'Scope 3 其他间接', value: '320', unit: 't', trend: '↑ 1.5%', color: '#a78bfa' },
  { label: '数据完整度', value: '92.5', unit: '%', trend: '↑ 4.2%', color: '#facc15' }
]

export const emissionStructure = [
  { name: 'Scope 1', value: 18520, percent: '94.4%', color: '#f5a623' },
  { name: 'Scope 2', value: 765, percent: '3.9%', color: '#4a9eff' },
  { name: 'Scope 3', value: 320, percent: '1.6%', color: '#a78bfa' }
]

/** 年度排放结构（供周期折算） */
export const annualEmissionStructure = emissionStructure

export const monthlyTrend = [1580, 1620, 1680, 1710, 1650, 1720, 1780, 1760, 1690, 1740, 1810, 1795]

/** 2024 各月总排放量 tCO₂e */
export const monthlyEmissions2024 = monthlyTrend

export const topEmissionSources = [
  { name: '1# 锅炉', type: '固定燃烧', scope: 'Scope 1', energy: '烟煤', activity: '5,200 t', emission: '9,882', ratio: '50.4%', quality: '实测' },
  { name: '2# 锅炉', type: '固定燃烧', scope: 'Scope 1', energy: '烟煤', activity: '4,800 t', emission: '9,121', ratio: '46.5%', quality: '实测' },
  { name: '外购电力', type: '外购电力', scope: 'Scope 2', energy: '电网', activity: '1,250,000 kWh', emission: '726', ratio: '3.7%', quality: '实测' },
  { name: '烘干热风炉', type: '固定燃烧', scope: 'Scope 1', energy: '天然气', activity: '180,000 m³', emission: '389', ratio: '2.0%', quality: '实测' },
  { name: '外购蒸汽', type: '外购热力', scope: 'Scope 2', energy: '蒸汽', activity: '5,200 GJ', emission: '39', ratio: '0.2%', quality: '统计' }
]

/** 排放源 — 配置监测对象；能值由接口同步至排放源，采集录入时引用 */
export const initialEmissionSources = [
  {
    id: 'es-001',
    name: '1#回转窑',
    sourceType: '固定燃烧',
    scope: 'Scope 1',
    energyType: '化石燃料',
    material: '原煤',
    park: 'igus园区',
    landParcel: 'A区-烧成线',
    factorId: 'nf-001',
    factorName: '烟煤低位发热量',
    method: '排放因子法',
    collection: '自动采集',
    activityUnit: 't',
    energyValue: '5,200',
    numericEnergyValue: 5200,
    energySyncedAt: '2024-12-31 23:59',
    status: '启用'
  },
  {
    id: 'es-002',
    name: '2#回转窑',
    sourceType: '固定燃烧',
    scope: 'Scope 1',
    energyType: '化石燃料',
    material: '原煤',
    park: 'igus园区',
    landParcel: 'A区-烧成线',
    factorId: 'nf-001',
    factorName: '烟煤低位发热量',
    method: '排放因子法',
    collection: '自动采集',
    activityUnit: 't',
    energyValue: '4,800',
    numericEnergyValue: 4800,
    energySyncedAt: '2024-12-31 23:59',
    status: '启用'
  },
  {
    id: 'es-003',
    name: '烘干热风炉',
    sourceType: '固定燃烧',
    scope: 'Scope 1',
    energyType: '化石燃料',
    material: '天然气',
    park: 'igus园区',
    landParcel: 'A区-烘干线',
    factorId: 'cf-002',
    factorName: '园区天然气燃烧因子',
    method: '排放因子法',
    collection: '自动采集',
    activityUnit: 'm³',
    energyValue: '180,000',
    numericEnergyValue: 180000,
    energySyncedAt: '2024-12-31 23:58',
    status: '启用'
  },
  {
    id: 'es-004',
    name: '厂内运输车队',
    sourceType: '移动燃烧',
    scope: 'Scope 1',
    energyType: '移动源',
    material: '柴油',
    park: 'igus园区',
    landParcel: 'C区-仓储',
    factorId: 'nf-004',
    factorName: '天然气低位发热量',
    method: '排放因子法',
    collection: '手动录入',
    activityUnit: 'L',
    energyValue: '49,430',
    numericEnergyValue: 49430,
    energySyncedAt: '2024-12-29 14:30',
    status: '启用'
  },
  {
    id: 'es-005',
    name: '石灰石分解',
    sourceType: '过程排放',
    scope: 'Scope 1',
    energyType: '过程排放',
    material: '石灰石',
    park: 'igus园区',
    landParcel: 'A区-烧成线',
    factorId: 'if-003',
    factorName: '石灰生产过程 CO₂',
    method: '物料平衡法',
    collection: '手动录入',
    activityUnit: 't',
    energyValue: '850',
    numericEnergyValue: 850,
    energySyncedAt: '2024-12-28 09:00',
    status: '启用'
  },
  {
    id: 'es-006',
    name: '外购电力',
    sourceType: '外购电力',
    scope: 'Scope 2',
    energyType: '外购电力',
    material: '电网',
    park: 'igus园区',
    landParcel: 'B区-动力站',
    factorId: 'gf-001',
    factorName: '华东区域电网',
    method: '排放因子法',
    collection: '自动采集',
    activityUnit: 'kWh',
    energyValue: '1,250,000',
    numericEnergyValue: 1250000,
    energySyncedAt: '2024-12-31 23:58',
    status: '启用'
  },
  {
    id: 'es-007',
    name: '外购蒸汽',
    sourceType: '外购热力',
    scope: 'Scope 2',
    energyType: '外购热力',
    material: '蒸汽',
    park: 'igus园区',
    landParcel: 'B区-动力站',
    factorId: 'cf-001',
    factorName: 'igus园区购电因子',
    method: '排放因子法',
    collection: '系统对接',
    activityUnit: 'kWh',
    energyValue: '67,129',
    numericEnergyValue: 67129,
    energySyncedAt: '2024-12-30 18:00',
    status: '启用'
  },
  {
    id: 'es-008',
    name: '员工通勤',
    sourceType: '其他间接',
    scope: 'Scope 3',
    energyType: '其他',
    material: '汽油',
    park: 'igus园区',
    landParcel: 'D区-行政办公',
    factorId: 'cf-003',
    factorName: '员工通勤排放因子',
    method: '排放因子法',
    collection: '手动录入',
    activityUnit: 'km',
    energyValue: '84,906',
    numericEnergyValue: 84906,
    energySyncedAt: '2024-12-28 10:15',
    status: '启用'
  }
]

/** 兼容未改造页面 */
export const emissionSources = initialEmissionSources.map((s) => ({
  name: s.name,
  source: s.sourceType,
  scope: s.scope,
  material: s.material,
  line: s.landParcel,
  method: s.method,
  emission: '—',
  collection: s.collection,
  status: s.status
}))

export const activityStats = [
  { icon: 'A', label: '自动采集(能源管理平台)', count: 5, color: '#1dbf73' },
  { icon: 'S', label: '系统对接(ERP/MES)', count: 1, color: '#4a9eff' },
  { icon: 'M', label: '手动录入', count: 2, color: '#f5a623' },
  { icon: '!', label: '数据缺口', count: 0, color: '#8b6914' }
]

/** 活动数据阈值规则 — 按排放源配置月度/年度核算碳值 (tCO₂e) 监控阈值 */
export const initialActivityThresholdRules = [
  { sourceId: 'es-001', monthlyThresholdMin: 28000, monthlyThresholdMax: 32000, annualThresholdMin: 95000, annualThresholdMax: 110000 },
  { sourceId: 'es-002', monthlyThresholdMin: 17000, monthlyThresholdMax: 20000, annualThresholdMin: 85000, annualThresholdMax: 100000 },
  { sourceId: 'es-003', monthlyThresholdMin: 700, monthlyThresholdMax: 900, annualThresholdMin: 3500, annualThresholdMax: 4500 },
  { sourceId: 'es-004', monthlyThresholdMin: 120, monthlyThresholdMax: 160, annualThresholdMin: 1200, annualThresholdMax: 1800 },
  { sourceId: 'es-006', monthlyThresholdMin: 1300, monthlyThresholdMax: 1600, annualThresholdMin: 7000, annualThresholdMax: 9000 },
  { sourceId: 'es-007', monthlyThresholdMin: 35, monthlyThresholdMax: 45, annualThresholdMin: 380, annualThresholdMax: 480 },
  { sourceId: 'es-008', monthlyThresholdMin: 18, monthlyThresholdMax: 22, annualThresholdMin: 200, annualThresholdMax: 260 }
]

/** 监控配置 — 设置后持续监控 */
export const initialMonitoringConfig = [
  { sourceId: 'es-001', monitoredAt: '2024-01-01 08:00:00', status: '监控中' },
  { sourceId: 'es-002', monitoredAt: '2024-01-01 08:00:00', status: '监控中' },
  { sourceId: 'es-003', monitoredAt: '2024-01-01 08:00:00', status: '监控中' },
  { sourceId: 'es-004', monitoredAt: '2024-03-01 09:00:00', status: '监控中' },
  { sourceId: 'es-006', monitoredAt: '2024-01-01 08:00:00', status: '监控中' },
  { sourceId: 'es-007', monitoredAt: '2024-01-01 08:00:00', status: '监控中' },
  { sourceId: 'es-008', monitoredAt: '2024-06-01 10:00:00', status: '监控中' }
]

export const collectionFrequencyMap = {
  自动采集: { label: '实时接口监测', hint: '接口持续推送，自动生成数据记录' },
  系统对接: { label: '月度传输', hint: '每月一次批量传输数据' },
  手动录入: { label: '手工导入', hint: '按周期手工导入数据记录' }
}

/** 活动数据历史记录 */
export const initialActivityRecords = [
  { id: 'rec-001', sourceId: 'es-001', recordPeriod: '2024-12-31', energyValue: '5,200', numericValue: 5200, unit: 't', recordSource: '接口同步', recordedAt: '2024-12-31 23:59' },
  { id: 'rec-002', sourceId: 'es-001', recordPeriod: '2024-12-30', energyValue: '5,180', numericValue: 5180, unit: 't', recordSource: '接口同步', recordedAt: '2024-12-30 23:59' },
  { id: 'rec-003', sourceId: 'es-001', recordPeriod: '2024-12-29', energyValue: '5,150', numericValue: 5150, unit: 't', recordSource: '接口同步', recordedAt: '2024-12-29 23:59' },
  { id: 'rec-004', sourceId: 'es-002', recordPeriod: '2024-12-31', energyValue: '4,800', numericValue: 4800, unit: 't', recordSource: '接口同步', recordedAt: '2024-12-31 23:59' },
  { id: 'rec-005', sourceId: 'es-002', recordPeriod: '2024-12-30', energyValue: '4,780', numericValue: 4780, unit: 't', recordSource: '接口同步', recordedAt: '2024-12-30 23:59' },
  { id: 'rec-006', sourceId: 'es-003', recordPeriod: '2024-12-31', energyValue: '180,000', numericValue: 180000, unit: 'm³', recordSource: '接口同步', recordedAt: '2024-12-31 23:58' },
  { id: 'rec-007', sourceId: 'es-003', recordPeriod: '2024-12-30', energyValue: '178,500', numericValue: 178500, unit: 'm³', recordSource: '接口同步', recordedAt: '2024-12-30 23:58' },
  { id: 'rec-008', sourceId: 'es-006', recordPeriod: '2024-12-31', energyValue: '1,250,000', numericValue: 1250000, unit: 'kWh', recordSource: '接口同步', recordedAt: '2024-12-31 23:58' },
  { id: 'rec-009', sourceId: 'es-006', recordPeriod: '2024-12-30', energyValue: '1,248,000', numericValue: 1248000, unit: 'kWh', recordSource: '接口同步', recordedAt: '2024-12-30 23:58' },
  { id: 'rec-010', sourceId: 'es-007', recordPeriod: '2024-12', energyValue: '67,129', numericValue: 67129, unit: 'kWh', recordSource: '月度传输', recordedAt: '2024-12-30 18:00' },
  { id: 'rec-011', sourceId: 'es-007', recordPeriod: '2024-11', energyValue: '65,800', numericValue: 65800, unit: 'kWh', recordSource: '月度传输', recordedAt: '2024-11-30 18:00' },
  { id: 'rec-012', sourceId: 'es-007', recordPeriod: '2024-10', energyValue: '64,200', numericValue: 64200, unit: 'kWh', recordSource: '月度传输', recordedAt: '2024-10-31 18:00' },
  { id: 'rec-013', sourceId: 'es-004', recordPeriod: '2024-12', energyValue: '49,430', numericValue: 49430, unit: 'L', recordSource: '手工导入', recordedAt: '2024-12-29 14:30' },
  { id: 'rec-014', sourceId: 'es-004', recordPeriod: '2024-11', energyValue: '48,200', numericValue: 48200, unit: 'L', recordSource: '手工导入', recordedAt: '2024-11-28 14:30' },
  { id: 'rec-015', sourceId: 'es-008', recordPeriod: '2024-12', energyValue: '84,906', numericValue: 84906, unit: 'km', recordSource: '手工导入', recordedAt: '2024-12-28 10:15' },
  { id: 'rec-016', sourceId: 'es-008', recordPeriod: '2024-11', energyValue: '82,100', numericValue: 82100, unit: 'km', recordSource: '手工导入', recordedAt: '2024-11-27 10:15' }
]

/** 兼容未改造页面 */
export const initialActivityDataRows = []
export const activityDataRows = initialActivityDataRows

export const factorCategories = [
  { id: 'national', label: '国家标准' },
  { id: 'industry', label: '行业排放因子' },
  { id: 'grid', label: '区域电网' },
  { id: 'custom', label: '自定义因子' }
]

export const nationalFactors = [
  {
    id: 'nf-001',
    category: 'national',
    name: '烟煤低位发热量',
    value: '26.344',
    unit: 'GJ/t',
    material: '烟煤',
    standard: 'GB/T 32150-2015',
    version: 'v2.1',
    updated: '2024-01-15',
    changeHistory: [
      { time: '2024-01-15 10:00:00', version: 'v2.1', field: '因子值', oldValue: '26.100', newValue: '26.344', operator: '系统同步', reason: 'GB/T 32150-2015 标准参数更新' },
      { time: '2023-06-20 14:30:00', version: 'v2.0', field: '因子值', oldValue: '25.800', newValue: '26.100', operator: '管理员', reason: '行业核查反馈修正' },
      { time: '2022-03-10 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '25.800', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'nf-002',
    category: 'national',
    name: '烟煤单位热值含碳量',
    value: '0.02618',
    unit: 'tC/GJ',
    material: '烟煤',
    standard: 'GB/T 32150-2015',
    version: 'v2.1',
    updated: '2024-01-15',
    changeHistory: [
      { time: '2024-01-15 10:00:00', version: 'v2.1', field: '因子值', oldValue: '0.02600', newValue: '0.02618', operator: '系统同步', reason: 'GB/T 32150-2015 标准参数更新' },
      { time: '2022-03-10 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.02600', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'nf-003',
    category: 'national',
    name: '烟煤碳氧化率',
    value: '98',
    unit: '%',
    material: '烟煤',
    standard: 'GB/T 32150-2015',
    version: 'v2.1',
    updated: '2024-01-15',
    changeHistory: [
      { time: '2024-01-15 10:00:00', version: 'v2.1', field: '因子值', oldValue: '97', newValue: '98', operator: '系统同步', reason: 'GB/T 32150-2015 标准参数更新' },
      { time: '2022-03-10 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '97', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'nf-004',
    category: 'national',
    name: '天然气低位发热量',
    value: '38.931',
    unit: 'GJ/10⁴m³',
    material: '天然气',
    standard: 'GB/T 32150-2015',
    version: 'v2.1',
    updated: '2024-01-15',
    changeHistory: [
      { time: '2024-01-15 10:00:00', version: 'v2.1', field: '因子值', oldValue: '38.700', newValue: '38.931', operator: '系统同步', reason: 'GB/T 32150-2015 标准参数更新' },
      { time: '2022-03-10 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '38.700', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  }
]

export const gridFactors = [
  {
    id: 'gf-001',
    category: 'grid',
    name: '华东区域电网',
    value: '0.5810',
    unit: 'tCO₂/MWh',
    material: '电网',
    standard: '生态环境部',
    version: 'v2023.1',
    updated: '2024-12-15',
    changeHistory: [
      { time: '2024-12-15 09:30:00', version: 'v2023.1', field: '因子值', oldValue: '0.5703', newValue: '0.5810', operator: '系统同步', reason: '生态环境部 2023 年度华东区域电网因子发布' },
      { time: '2023-03-28 11:00:00', version: 'v2022.1', field: '因子值', oldValue: '0.5810', newValue: '0.5703', operator: '系统同步', reason: '切换为 2022 年度因子（临时）' },
      { time: '2022-01-10 08:00:00', version: 'v2022.1', field: '因子值', oldValue: '—', newValue: '0.5810', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'gf-002',
    category: 'grid',
    name: '华北区域电网',
    value: '0.8843',
    unit: 'tCO₂/MWh',
    material: '电网',
    standard: '生态环境部',
    version: 'v2023.1',
    updated: '2024-11-20',
    changeHistory: [
      { time: '2024-11-20 16:00:00', version: 'v2023.1', field: '因子值', oldValue: '0.9419', newValue: '0.8843', operator: '系统同步', reason: '生态环境部 2023 年度华北区域电网因子发布' },
      { time: '2022-01-10 08:00:00', version: 'v2022.1', field: '因子值', oldValue: '—', newValue: '0.9419', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'gf-003',
    category: 'grid',
    name: '华南区域电网',
    value: '0.4326',
    unit: 'tCO₂/MWh',
    material: '电网',
    standard: '生态环境部',
    version: 'v2023.1',
    updated: '2024-10-08',
    changeHistory: [
      { time: '2024-10-08 10:15:00', version: 'v2023.1', field: '因子值', oldValue: '0.4042', newValue: '0.4326', operator: '系统同步', reason: '生态环境部 2023 年度华南区域电网因子发布' },
      { time: '2022-01-10 08:00:00', version: 'v2022.1', field: '因子值', oldValue: '—', newValue: '0.4042', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  }
]

export const industryFactors = [
  {
    id: 'if-001',
    category: 'industry',
    name: '水泥熟料生产过程 CO₂',
    value: '0.538',
    unit: 'tCO₂/t熟料',
    material: '水泥熟料',
    standard: '中国水泥协会指南',
    version: 'v1.2',
    updated: '2024-08-20',
    changeHistory: [
      { time: '2024-08-20 14:00:00', version: 'v1.2', field: '因子值', oldValue: '0.525', newValue: '0.538', operator: '系统同步', reason: '2024 版行业指南更新' },
      { time: '2023-01-15 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.525', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'if-002',
    category: 'industry',
    name: '钢铁烧结过程 CO₂',
    value: '0.185',
    unit: 'tCO₂/t烧结矿',
    material: '烧结矿',
    standard: '钢铁行业低碳指南',
    version: 'v1.1',
    updated: '2024-06-10',
    changeHistory: [
      { time: '2024-06-10 11:30:00', version: 'v1.1', field: '因子值', oldValue: '0.192', newValue: '0.185', operator: '管理员', reason: '行业核查数据修正' },
      { time: '2023-03-01 08:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.192', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  },
  {
    id: 'if-003',
    category: 'industry',
    name: '石灰生产过程 CO₂',
    value: '0.440',
    unit: 'tCO₂/t石灰',
    material: '石灰石',
    standard: '建材行业排放指南',
    version: 'v1.0',
    updated: '2023-09-01',
    changeHistory: [
      { time: '2023-09-01 10:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.440', operator: '系统初始化', reason: '因子库首次录入' }
    ]
  }
]

export const customFactors = [
  {
    id: 'cf-001',
    category: 'custom',
    name: 'igus园区购电因子',
    value: '0.5810',
    unit: 'tCO₂/MWh',
    material: '电网',
    standard: '企业自定义',
    version: 'v1.0',
    updated: '2024-12-01',
    changeHistory: [
      { time: '2024-12-01 09:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.5810', operator: '管理员', reason: '绑定华东区域电网因子' }
    ]
  },
  {
    id: 'cf-002',
    category: 'custom',
    name: '园区天然气燃烧因子',
    value: '2.1622',
    unit: 'kgCO₂/m³',
    material: '天然气',
    standard: '企业自定义',
    version: 'v1.1',
    updated: '2024-09-15',
    changeHistory: [
      { time: '2024-09-15 16:20:00', version: 'v1.1', field: '因子值', oldValue: '2.1500', newValue: '2.1622', operator: '管理员', reason: '实测数据校准' },
      { time: '2024-01-10 08:00:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '2.1500', operator: '系统初始化', reason: '自定义因子创建' }
    ]
  },
  {
    id: 'cf-003',
    category: 'custom',
    name: '员工通勤排放因子',
    value: '0.212',
    unit: 'kgCO₂/km',
    material: '汽油',
    standard: '企业自定义',
    version: 'v1.0',
    updated: '2024-12-28',
    changeHistory: [
      { time: '2024-12-28 10:15:00', version: 'v1.0', field: '因子值', oldValue: '—', newValue: '0.212', operator: '张三', reason: '手动录入通勤核算因子' }
    ]
  }
]

/** 全部排放因子（含变更记录） */
export const allEmissionFactors = [
  ...nationalFactors,
  ...industryFactors,
  ...gridFactors,
  ...customFactors
]

/** 各分类因子数量 */
export function getFactorCategoryCounts() {
  return factorCategories.map((cat) => ({
    ...cat,
    count: allEmissionFactors.filter((f) => f.category === cat.id).length
  }))
}

/** 展平为变更流水，供区间筛选 */
export function flattenFactorChangeLogs(factors = allEmissionFactors) {
  return factors.flatMap((factor) =>
    (factor.changeHistory ?? []).map((log) => ({
      ...log,
      factorId: factor.id,
      factorName: factor.name,
      category: factor.category,
      categoryLabel: factorCategories.find((c) => c.id === factor.category)?.label ?? factor.category
    }))
  )
}

export const accountingSteps = [
  { step: 1, label: '活动数据', value: '8 项', color: '#1dbf73' },
  { step: 2, label: '排放因子', value: '8 项', color: '#4a9eff' },
  { step: 3, label: '核算计算', value: '排放因子法', color: '#a78bfa' },
  { step: 4, label: '结果审核', value: '待审核', color: '#f5a623' },
  { step: 5, label: '总排放量', value: '19,605 tCO₂e', color: '#f87171' }
]

export const scopeSummaries = [
  { label: 'Scope 1 直接排放', value: '18,520 tCO₂e', detail: '5 个排放源 · 排放因子法 + 物料平衡法', color: '#f5a623' },
  { label: 'Scope 2 间接排放', value: '765 tCO₂e', detail: '2 个排放源 · 排放因子法', color: '#4a9eff' },
  { label: 'Scope 3 其他间接', value: '320 tCO₂e', detail: '2 个排放源 · 排放因子法', color: '#a78bfa' },
  { label: '合计', value: '19,605 tCO₂e', detail: '碳排放强度：0.82 tCO₂e / 万元产值', color: '#1dbf73' }
]

export const typeDistribution = [
  { type: '固定燃烧', value: 19042, percent: 97.1, color: '#f5a623' },
  { type: '外购电力', value: 726, percent: 3.7, color: '#4a9eff' },
  { type: '过程排放', value: 340, percent: 1.7, color: '#a78bfa' },
  { type: '外购热力', value: 39, percent: 0.2, color: '#facc15' },
  { type: '移动燃烧', value: 139, percent: 0.7, color: '#94a3b8' },
  { type: '其他排放', value: 320, percent: 1.6, color: '#c084fc' }
]

export const calculationDetails = [
  { source: '1#回转窑', activity: '5,200 t', factor: '× 1.9003', emission: '= 9,882 tCO₂e' },
  { source: '2#回转窑', activity: '4,800 t', factor: '× 1.9003', emission: '= 9,121 tCO₂e' },
  { source: '外购电力', activity: '1,250,000 kWh', factor: '× 0.5810', emission: '= 726 tCO₂e' },
  { source: '烘干热风炉', activity: '180,000 m³', factor: '× 2.1622', emission: '= 389 tCO₂e' }
]

export const auditLogs = [
  { time: '2024-12-31 23:59:15', content: '系统自动核算完成，总排放量 19,605 tCO₂e', module: '碳核算', operator: '系统' },
  { time: '2024-12-31 23:58:42', content: '数据采集完成，从能源管理平台同步 5 项活动数据', module: '数据采集', operator: '系统' },
  { time: '2024-12-31 23:58:10', content: '数据采集完成，从 ERP 系统同步 1 项（外购蒸汽）', module: '数据采集', operator: '系统' },
  { time: '2024-12-28 10:15:33', content: '用户「张三」手动录入员工通勤数据', module: '数据采集', operator: '张三' },
  { time: '2024-12-15 09:30:00', content: '排放因子库更新：华东区域电网因子', module: '排放因子', operator: '李四' },
  { time: '2024-12-01 08:00:00', content: '系统初始化，开始 2024 年度核算周期', module: '系统', operator: '系统' }
]

export const qualityDistribution = [
  { label: '实测', count: 5, percent: 71, color: '#52c41a' },
  { label: '统计', count: 1, percent: 14, color: '#faad14' },
  { label: '估算', count: 1, percent: 14, color: '#ff4d4f' }
]

export const qualityDetails = [
  { source: '1#回转窑', item: '电煤消耗量', quality: '实测', method: '自动采集', checked: '2024-12-31 23:59', status: '正常' },
  { source: '2#回转窑', item: '电煤消耗量', quality: '实测', method: '自动采集', checked: '2024-12-31 23:59', status: '正常' },
  { source: '外购蒸汽', item: '外购蒸汽量', quality: '统计', method: '系统对接', checked: '2024-12-30 18:00', status: '正常' },
  { source: '厂内运输车队', item: '柴油消耗量', quality: '统计', method: '手动录入', checked: '2024-12-29 14:30', status: '正常' },
  { source: '全体员工', item: '员工通勤里程', quality: '估算', method: '手动录入', checked: '2024-12-28 10:15', status: '待审核' }
]

export const productionLines = ['烧成车间', '烘干车间', '物流部', '全厂', '生产车间', '行政']
