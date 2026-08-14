import { factorCategories, allEmissionFactors as initialFactors } from '@/data/carbonMock'

export function cloneFactors(list) {
  return JSON.parse(JSON.stringify(list))
}

export function formatNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function formatDate() {
  return formatNow().slice(0, 10)
}

export function bumpVersion(version) {
  const m = String(version || 'v1.0').match(/^v(\d+)\.(\d+)$/)
  if (m) return `v${m[1]}.${Number(m[2]) + 1}`
  return 'v1.0'
}

export function defaultStandard(category) {
  const map = {
    national: 'GB/T 32150-2015',
    industry: '',
    grid: '生态环境部',
    custom: '企业自定义'
  }
  return map[category] ?? ''
}

export function createChangeLog({ version, field, oldValue, newValue, operator, reason }) {
  return {
    time: formatNow(),
    version,
    field,
    oldValue,
    newValue,
    operator: operator || '管理员',
    reason
  }
}

export function createFactorId(category) {
  const prefix = { national: 'nf', industry: 'if', grid: 'gf', custom: 'cf' }[category] || 'ef'
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function buildCategoryCounts(factors) {
  return factorCategories.map((cat) => ({
    ...cat,
    count: factors.filter((f) => f.category === cat.id).length
  }))
}

export function parseFactorCsv(text, category) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { rows: [], error: '文件内容为空或缺少数据行' }

  const header = lines[0].split(',').map((h) => h.trim())
  const required = ['因子名称', '因子值', '单位', '适用燃料/物料', '来源标准']
  const missing = required.filter((col) => !header.includes(col))
  if (missing.length) {
    return { rows: [], error: `缺少必填列：${missing.join('、')}` }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    if (!cols[idx['因子名称']]) continue
    rows.push({
      category,
      name: cols[idx['因子名称']],
      value: cols[idx['因子值']],
      unit: cols[idx['单位']],
      material: cols[idx['适用燃料/物料']],
      standard: cols[idx['来源标准']] || defaultStandard(category),
      version: 'v1.0',
      updated: formatDate(),
      changeHistory: []
    })
  }

  if (!rows.length) return { rows: [], error: '未解析到有效数据行' }
  return { rows, error: null }
}

export const IMPORT_TEMPLATE = `因子名称,因子值,单位,适用燃料/物料,来源标准
示例因子,1.234,tCO₂/t,烟煤,GB/T 32150-2015`

export const EXPORT_HEADERS = ['因子名称', '因子值', '单位', '适用燃料/物料', '来源标准', '当前版本', '更新时间']

function escapeCsvCell(val) {
  const s = String(val ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** 导出排放因子为 CSV 并触发下载 */
export function exportFactorsToCsv(factors, filename = '排放因子.csv') {
  const lines = [EXPORT_HEADERS.join(',')]
  for (const f of factors) {
    lines.push(
      [f.name, f.value, f.unit, f.material, f.standard, f.version, f.updated]
        .map(escapeCsvCell)
        .join(',')
    )
  }
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export { initialFactors }
