import { formatNow } from '@/composables/useEmissionFactors'

export const RECORD_IMPORT_HEADERS = ['排放源', '记录周期', '能值']

export const RECORD_IMPORT_TEMPLATE = `${RECORD_IMPORT_HEADERS.join(',')}
员工通勤,2024-12,84906`

export function createRecordId() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/** 解析手工数据记录 CSV（仅适用于数据采集=手动录入的排放源） */
export function parseRecordCsv(text, sourceResolver, isMonitored) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['文件内容为空或缺少数据行'] }

  const header = lines[0].split(',').map((h) => h.trim().replace(/^\uFEFF/, ''))
  const required = ['排放源', '记录周期', '能值']
  const missing = required.filter((col) => !header.includes(col))
  if (missing.length) {
    return { rows: [], errors: [`缺少必填列：${missing.join('、')}`] }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows = []
  const errors = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const sourceName = cols[idx['排放源']]
    const recordPeriod = cols[idx['记录周期']]
    if (!sourceName || !recordPeriod) continue

    const source = sourceResolver(sourceName)
    if (!source) {
      errors.push(`第 ${i + 1} 行：未找到排放源「${sourceName}」`)
      continue
    }
    if (source.collection !== '手动录入') {
      errors.push(`第 ${i + 1} 行「${sourceName}」：仅支持手工导入类型排放源`)
      continue
    }
    if (isMonitored && !isMonitored(source.id)) {
      errors.push(`第 ${i + 1} 行「${sourceName}」：该排放源未设置监控`)
      continue
    }

    const numericValue = parseNum(cols[idx['能值']])
    if (numericValue == null) {
      errors.push(`第 ${i + 1} 行「${sourceName}」：能值无效`)
      continue
    }

    rows.push({
      sourceId: source.id,
      sourceName: source.name,
      recordPeriod,
      energyValue: formatEnergyValue(numericValue),
      numericValue,
      unit: source.activityUnit ?? '—',
      recordSource: '手工导入',
      recordedAt: formatNow()
    })
  }

  if (!rows.length && !errors.length) {
    return { rows: [], errors: ['未解析到有效数据行'] }
  }
  return { rows, errors }
}

export function downloadRecordTemplate() {
  const blob = new Blob([`\uFEFF${RECORD_IMPORT_TEMPLATE}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '数据记录导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseNum(val) {
  if (val == null || val === '') return null
  const n = Number(String(val).replace(/,/g, ''))
  return Number.isNaN(n) ? null : n
}

function formatEnergyValue(num) {
  if (num == null || Number.isNaN(num)) return ''
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export { formatEnergyValue, parseNum as parseActivityNumeric }
