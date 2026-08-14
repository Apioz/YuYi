import { computed, ref } from 'vue'
import {
  parks,
  landParcels,
  energyTypes,
  factorCategories,
  initialEmissionSources,
  initialActivityRecords,
  initialMonitoringConfig,
  initialActivityThresholdRules,
  collectionFrequencyMap,
  monthlyEmissions2024,
  annualEmissionStructure,
  annualScopeRatios,
  allEmissionFactors
} from '@/data/carbonMock'
import { formatNow } from '@/composables/useEmissionFactors'
import { formatEnergyValue, parseActivityNumeric, createRecordId } from '@/composables/useActivityData'
import { enrichActivityRow } from '@/composables/useCarbonCalculation'

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function parseNumeric(value) {
  if (value == null || value === '') return NaN
  return Number(String(value).replace(/,/g, ''))
}

function formatNumber(num) {
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** 评估单条活动数据是否超出阈值（基于核算碳值 tCO₂e） */
export function evaluateThreshold(row, thresholdRule) {
  const numeric = row.carbonNumeric ?? parseNumeric(row.carbonValue)
  if (Number.isNaN(numeric)) return '正常'
  const min = thresholdRule?.thresholdMin
  const max = thresholdRule?.thresholdMax
  if (max != null && numeric > max) return '超上限'
  if (min != null && numeric < min) return '超下限'
  return '正常'
}

export function getThresholdRuleForSource(sourceId, rules) {
  return rules.find((r) => r.sourceId === sourceId) ?? null
}

export function formatThresholdRange(rule) {
  if (!rule) return '—'
  const parts = []
  if (rule.thresholdMin != null) parts.push(`≥ ${rule.thresholdMin.toLocaleString()}`)
  if (rule.thresholdMax != null) parts.push(`≤ ${rule.thresholdMax.toLocaleString()}`)
  return parts.join('，') || '—'
}

/** 因子所属模块（执行标准） */
export function getFactorModuleLabel(categoryId) {
  return factorCategories.find((c) => c.id === categoryId)?.label ?? '—'
}

/** 根据月份索引（0-11）获取月度总排放 */
export function getMonthEmission(monthIndex) {
  return monthlyEmissions2024[monthIndex] ?? 0
}

/** 获取季度包含的月份索引 */
export function getQuarterMonthIndexes(quarter) {
  const start = (quarter - 1) * 3
  return [start, start + 1, start + 2]
}

/** 计算指定月份范围的排放总量 */
export function sumEmissionsForMonths(monthIndexes) {
  return monthIndexes.reduce((sum, idx) => sum + getMonthEmission(idx), 0)
}

/** 按 Scope 比例拆分总排放 */
export function splitEmissionByScope(total) {
  return annualEmissionStructure.map((item) => ({
    ...item,
    value: Math.round(total * annualScopeRatios[item.name])
  }))
}

/** 构建周期总览 KPI */
export function buildOverviewKpis(total, periodLabel, compareTotal) {
  const scopeParts = splitEmissionByScope(total)
  const scope1 = scopeParts.find((s) => s.name === 'Scope 1')?.value ?? 0
  const scope2 = scopeParts.find((s) => s.name === 'Scope 2')?.value ?? 0
  const scope3 = scopeParts.find((s) => s.name === 'Scope 3')?.value ?? 0

  let trend = '—'
  if (compareTotal != null && compareTotal > 0) {
    const change = ((total - compareTotal) / compareTotal) * 100
    const sign = change >= 0 ? '↑' : '↓'
    trend = `${sign} ${Math.abs(change).toFixed(1)}% 环比`
  }

  return [
    { label: `总排放量 (${periodLabel})`, value: formatNumber(total), unit: 'tCO₂e', trend, color: '#1dbf73' },
    { label: 'Scope 1 直接排放', value: formatNumber(scope1), unit: 'tCO₂e', trend: '—', color: '#f5a623' },
    { label: 'Scope 2 间接排放', value: formatNumber(scope2), unit: 'tCO₂e', trend: '—', color: '#4a9eff' },
    { label: 'Scope 3 其他间接', value: formatNumber(scope3), unit: 'tCO₂e', trend: '—', color: '#a78bfa' },
    { label: '数据完整度', value: '92.5', unit: '%', trend: '↑ 4.2%', color: '#facc15' }
  ]
}

/** 构建排放结构（含占比） */
export function buildEmissionStructure(total) {
  const parts = splitEmissionByScope(total)
  return parts.map((item) => ({
    ...item,
    percent: total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'
  }))
}

/** 构建 conic-gradient 用于环图 */
export function buildDonutGradient(structure) {
  let cursor = 0
  const segments = structure.map((item) => {
    const pct = parseFloat(item.percent) || 0
    const start = cursor
    cursor += pct
    return `${item.color} ${start}% ${cursor}%`
  })
  return segments.join(', ')
}

const emissionSourceList = ref(clone(initialEmissionSources))
const monitoringConfigList = ref(clone(initialMonitoringConfig))
const activityRecordList = ref(clone(initialActivityRecords))
const activityThresholdRules = ref(clone(initialActivityThresholdRules))

function getLatestRecordForSource(records, sourceId) {
  const list = records.filter((r) => r.sourceId === sourceId)
  if (!list.length) return null
  return [...list].sort((a, b) => String(b.recordedAt).localeCompare(String(a.recordedAt)))[0]
}

function recordToActivityRow(record, source) {
  if (!record || !source) return null
  return {
    id: record.id,
    sourceId: source.id,
    source: source.name,
    item: `${source.name}活动数据`,
    energyValue: record.energyValue,
    numericValue: record.numericValue,
    unit: record.unit ?? source.activityUnit ?? '—',
    factorId: source.factorId,
    factor: source.factorName,
    recordPeriod: record.recordPeriod,
    recordSource: record.recordSource,
    updated: record.recordedAt,
    recordCount: 0
  }
}

function buildThresholdSettingsRows(sources, rules) {
  return sources.map((source) => {
    const existing = rules.find((r) => r.sourceId === source.id)
    return {
      sourceId: source.id,
      sourceName: source.name,
      scope: source.scope,
      thresholdMin: existing?.thresholdMin ?? null,
      thresholdMax: existing?.thresholdMax ?? null
    }
  })
}

export function useCarbonBusiness() {
  function getFactorById(factorId) {
    return allEmissionFactors.find((f) => f.id === factorId)
  }

  function getEmissionSourceById(id) {
    return emissionSourceList.value.find((s) => s.id === id)
  }

  const monitoredSourceIds = computed(() => new Set(monitoringConfigList.value.map((m) => m.sourceId)))

  const activityDataWithThreshold = computed(() =>
    monitoringConfigList.value
      .map((mon) => {
        const source = getEmissionSourceById(mon.sourceId)
        if (!source) return null
        const records = activityRecordList.value.filter((r) => r.sourceId === mon.sourceId)
        const latest = getLatestRecordForSource(activityRecordList.value, mon.sourceId)
        const base = recordToActivityRow(latest, source)
        if (!base) {
          return {
            id: `mon-${mon.sourceId}`,
            sourceId: mon.sourceId,
            source: source.name,
            item: `${source.name}活动数据`,
            energyValue: '—',
            numericValue: null,
            unit: source.activityUnit ?? '—',
            factorId: source.factorId,
            factor: source.factorName,
            recordPeriod: '—',
            recordSource: '—',
            updated: mon.monitoredAt,
            recordCount: 0,
            collection: source.collection,
            collectionFrequency: collectionFrequencyMap[source.collection]?.label ?? '—',
            monitoredAt: mon.monitoredAt,
            calcFormula: '—',
            carbonNumeric: null,
            carbonValue: '—',
            thresholdMin: null,
            thresholdMax: null,
            thresholdStatus: '正常',
            isAlert: false,
            hasData: false
          }
        }
        const factor = getFactorById(base.factorId ?? source.factorId)
        const enriched = enrichActivityRow(base, source, factor)
        const thresholdRule = getThresholdRuleForSource(mon.sourceId, activityThresholdRules.value)
        const thresholdStatus = evaluateThreshold(enriched, thresholdRule)
        return {
          ...enriched,
          collection: source.collection,
          collectionFrequency: collectionFrequencyMap[source.collection]?.label ?? '—',
          monitoredAt: mon.monitoredAt,
          recordCount: records.length,
          hasData: true,
          thresholdMin: thresholdRule?.thresholdMin ?? null,
          thresholdMax: thresholdRule?.thresholdMax ?? null,
          thresholdStatus,
          isAlert: thresholdStatus !== '正常'
        }
      })
      .filter(Boolean)
  )

  const activityDataList = computed(() => activityDataWithThreshold.value)

  const collectableEmissionSources = computed(() =>
    emissionSourceList.value.filter((s) => s.status === '启用')
  )

  const activityStats = computed(() => {
    const rows = activityDataWithThreshold.value.filter((r) => r.hasData)
    const realtime = rows.filter((r) => r.collection === '自动采集').length
    const monthly = rows.filter((r) => r.collection === '系统对接').length
    const manual = rows.filter((r) => r.collection === '手动录入').length
    const alert = activityDataWithThreshold.value.filter((r) => r.isAlert).length
    return [
      { icon: 'R', label: '实时接口监测', count: realtime, color: '#1dbf73' },
      { icon: 'M', label: '月度传输', count: monthly, color: '#4a9eff' },
      { icon: 'H', label: '手工导入记录', count: manual, color: '#f5a623' },
      { icon: '!', label: '阈值超限', count: alert, color: '#ff4d4f' }
    ]
  })

  const thresholdSettingsRows = computed(() =>
    buildThresholdSettingsRows(emissionSourceList.value, activityThresholdRules.value)
  )

  const thresholdAlerts = computed(() =>
    activityDataWithThreshold.value
      .filter((row) => row.isAlert)
      .map((row) => ({
        id: row.id,
        item: row.item,
        source: row.source,
        energyValue: row.energyValue,
        unit: row.unit,
        carbonValue: row.carbonValue,
        thresholdMin: row.thresholdMin,
        thresholdMax: row.thresholdMax,
        thresholdStatus: row.thresholdStatus,
        updated: row.updated,
        level: row.thresholdStatus === '超上限' ? 'danger' : 'warning'
      }))
  )

  const thresholdAlertCount = computed(() => thresholdAlerts.value.length)

  function getActivityRecordsBySourceId(sourceId) {
    return [...activityRecordList.value]
      .filter((r) => r.sourceId === sourceId)
      .sort((a, b) => String(b.recordedAt).localeCompare(String(a.recordedAt)))
  }

  function getEnrichedRecordsBySourceId(sourceId) {
    const source = getEmissionSourceById(sourceId)
    const factor = getFactorById(source?.factorId)
    return getActivityRecordsBySourceId(sourceId).map((record) => {
      const base = recordToActivityRow(record, source)
      return enrichActivityRow(base, source, factor)
    })
  }

  function isSourceMonitored(sourceId) {
    return monitoringConfigList.value.some((m) => m.sourceId === sourceId)
  }

  function addMonitoring(sourceIds) {
    const now = formatNow()
    for (const sourceId of sourceIds) {
      if (isSourceMonitored(sourceId)) continue
      monitoringConfigList.value.push({ sourceId, monitoredAt: now, status: '监控中' })
      const source = getEmissionSourceById(sourceId)
      if (source?.numericEnergyValue != null && source.collection === '自动采集') {
        const exists = activityRecordList.value.some((r) => r.sourceId === sourceId)
        if (!exists) {
          activityRecordList.value.push({
            id: createRecordId(),
            sourceId,
            recordPeriod: now.slice(0, 10),
            energyValue: source.energyValue ?? formatEnergyValue(source.numericEnergyValue),
            numericValue: source.numericEnergyValue,
            unit: source.activityUnit,
            recordSource: '接口同步',
            recordedAt: source.energySyncedAt ?? now
          })
        }
      }
    }
  }

  function removeMonitoring(sourceId) {
    const idx = monitoringConfigList.value.findIndex((m) => m.sourceId === sourceId)
    if (idx >= 0) monitoringConfigList.value.splice(idx, 1)
  }

  function deleteMonitoredActivity(sourceId) {
    removeMonitoring(sourceId)
    activityRecordList.value = activityRecordList.value.filter((r) => r.sourceId !== sourceId)
    const ruleIdx = activityThresholdRules.value.findIndex((r) => r.sourceId === sourceId)
    if (ruleIdx >= 0) activityThresholdRules.value.splice(ruleIdx, 1)
  }

  function addActivityRecord(record) {
    activityRecordList.value.push(record)
  }

  function addActivityRecordsBatch(records) {
    activityRecordList.value.push(...records)
  }

  function resolveRecordPeriod(source, syncedAt) {
    const base = syncedAt ?? formatNow()
    if (source?.collection === '自动采集') return base.slice(0, 10)
    return base.slice(0, 7)
  }

  /** 采集录入 — 引用排放源接口能值，写入活动数据记录 */
  function collectActivityFromSources(sourceIds) {
    const now = formatNow()
    let count = 0
    for (const sourceId of sourceIds) {
      const source = getEmissionSourceById(sourceId)
      if (!source || source.numericEnergyValue == null) continue
      if (!isSourceMonitored(sourceId)) {
        monitoringConfigList.value.push({ sourceId, monitoredAt: now, status: '监控中' })
      }
      const syncedAt = source.energySyncedAt ?? now
      activityRecordList.value.push({
        id: createRecordId(),
        sourceId,
        recordPeriod: resolveRecordPeriod(source, syncedAt),
        energyValue: source.energyValue ?? formatEnergyValue(source.numericEnergyValue),
        numericValue: source.numericEnergyValue,
        unit: source.activityUnit,
        recordSource: '采集录入',
        recordedAt: syncedAt
      })
      count++
    }
    return count
  }

  function getExecutionStandard(factorId) {
    const factor = getFactorById(factorId)
    return factor ? getFactorModuleLabel(factor.category) : '—'
  }

  function resolveSourceByName(name) {
    const trimmed = String(name ?? '').trim()
    if (!trimmed) return null
    return emissionSourceList.value.find((s) => s.name === trimmed) ?? null
  }

  function getActivityDataBySourceId(sourceId) {
    return getEnrichedRecordsBySourceId(sourceId)
  }

  function saveActivityThresholdRules(rows) {
    activityThresholdRules.value = rows
      .filter((r) => r.thresholdMin != null || r.thresholdMax != null)
      .map((r) => ({
        sourceId: r.sourceId,
        thresholdMin: r.thresholdMin === '' || r.thresholdMin == null ? null : Number(r.thresholdMin),
        thresholdMax: r.thresholdMax === '' || r.thresholdMax == null ? null : Number(r.thresholdMax)
      }))
  }

  function getOverviewData({ periodType, month, quarter }) {
    let total = 0
    let trendData = []
    let periodLabel = ''
    let compareTotal = null

    if (periodType === 'month') {
      const idx = month - 1
      total = getMonthEmission(idx)
      periodLabel = `${month}月`
      trendData = monthlyEmissions2024
      if (idx > 0) compareTotal = getMonthEmission(idx - 1)
    } else {
      const indexes = getQuarterMonthIndexes(quarter)
      total = sumEmissionsForMonths(indexes)
      periodLabel = `Q${quarter}`
      trendData = indexes.map((idx) => getMonthEmission(idx))
      if (quarter > 1) {
        compareTotal = sumEmissionsForMonths(getQuarterMonthIndexes(quarter - 1))
      }
    }

    const structure = buildEmissionStructure(total)
    const kpis = buildOverviewKpis(total, periodLabel, compareTotal)

    return {
      total,
      periodLabel,
      kpis,
      structure,
      donutGradient: buildDonutGradient(structure),
      trendData,
      periodType
    }
  }

  function addEmissionSource(source) {
    emissionSourceList.value.push(source)
  }

  function addEmissionSources(sources) {
    emissionSourceList.value.push(...sources)
  }

  function updateEmissionSource(id, patch) {
    const idx = emissionSourceList.value.findIndex((s) => s.id === id)
    if (idx >= 0) {
      emissionSourceList.value[idx] = { ...emissionSourceList.value[idx], ...patch }
    }
  }

  function deleteEmissionSource(id) {
    const idx = emissionSourceList.value.findIndex((s) => s.id === id)
    if (idx >= 0) emissionSourceList.value.splice(idx, 1)
  }

  function resolveFactorByName(name) {
    const trimmed = String(name ?? '').trim()
    if (!trimmed) return null
    return allEmissionFactors.find((f) => f.name === trimmed) ?? null
  }

  return {
    parks,
    landParcels,
    energyTypes,
    allEmissionFactors,
    collectionFrequencyMap,
    emissionSourceList,
    monitoringConfigList,
    activityRecordList,
    activityDataList,
    activityThresholdRules,
    activityDataWithThreshold,
    collectableEmissionSources,
    thresholdSettingsRows,
    thresholdAlerts,
    thresholdAlertCount,
    activityStats,
    getFactorById,
    getExecutionStandard,
    getFactorModuleLabel,
    getEmissionSourceById,
    getActivityDataBySourceId,
    getActivityRecordsBySourceId,
    getEnrichedRecordsBySourceId,
    isSourceMonitored,
    resolveFactorByName,
    resolveSourceByName,
    getOverviewData,
    addEmissionSource,
    addEmissionSources,
    updateEmissionSource,
    deleteEmissionSource,
    addMonitoring,
    deleteMonitoredActivity,
    addActivityRecord,
    addActivityRecordsBatch,
    collectActivityFromSources,
    saveActivityThresholdRules,
    getThresholdRuleForSource,
    formatThresholdRange,
    evaluateThreshold,
    parseNumeric,
    formatNumber
  }
}
