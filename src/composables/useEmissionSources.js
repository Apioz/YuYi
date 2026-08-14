/** 排放源 CSV 导入/导出工具 */

export const SOURCE_IMPORT_HEADERS = [
  '排放源名称',
  '排放类型',
  'GHG范围',
  '能源类型',
  '物料',
  '关联园区',
  '所属地块',
  '关联因子',
  '数据采集',
  '能值单位',
  '核算方法',
  '状态'
]

export const SOURCE_IMPORT_TEMPLATE = `${SOURCE_IMPORT_HEADERS.join(',')}
示例锅炉,固定燃烧,Scope 1,化石燃料,烟煤,igus园区,A区-烧成线,烟煤低位发热量,手动录入,t,排放因子法,启用`

function escapeCsvCell(val) {
  const s = String(val ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function createSourceId() {
  return `es-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/** 解析排放源 CSV，factorResolver(name) => factor object | null */
export function parseSourceCsv(text, factorResolver) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['文件内容为空或缺少数据行'] }

  const header = lines[0].split(',').map((h) => h.trim().replace(/^\uFEFF/, ''))
  const required = ['排放源名称', 'GHG范围', '物料', '关联因子']
  const missing = required.filter((col) => !header.includes(col))
  if (missing.length) {
    return { rows: [], errors: [`缺少必填列：${missing.join('、')}`] }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows = []
  const errors = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const name = cols[idx['排放源名称']]
    if (!name) continue

    const factorName = cols[idx['关联因子']] ?? ''
    const factor = factorResolver(factorName)
    if (!factor) {
      errors.push(`第 ${i + 1} 行「${name}」：未找到关联因子「${factorName}」`)
      continue
    }

    rows.push({
      name,
      sourceType: cols[idx['排放类型']] || '固定燃烧',
      scope: cols[idx['GHG范围']] || 'Scope 1',
      energyType: cols[idx['能源类型']] || '化石燃料',
      material: cols[idx['物料']] || '',
      park: cols[idx['关联园区']] || 'igus园区',
      landParcel: cols[idx['所属地块']] || '',
      factorId: factor.id,
      factorName: factor.name,
      collection: cols[idx['数据采集']] || '自动采集',
      activityUnit: cols[idx['能值单位']] || 't',
      method: cols[idx['核算方法']] || '排放因子法',
      status: cols[idx['状态']] || '启用'
    })
  }

  if (!rows.length && !errors.length) {
    return { rows: [], errors: ['未解析到有效数据行'] }
  }
  return { rows, errors }
}

/** 导出排放源 CSV */
export function exportSourcesToCsv(sources, filename = '排放源.csv') {
  const lines = [SOURCE_IMPORT_HEADERS.join(',')]
  for (const s of sources) {
    lines.push(
      [
        s.name,
        s.sourceType,
        s.scope,
        s.energyType,
        s.material,
        s.park,
        s.landParcel,
        s.factorName,
        s.collection,
        s.activityUnit ?? 't',
        s.method,
        s.status
      ]
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

export function downloadSourceTemplate() {
  const blob = new Blob([`\uFEFF${SOURCE_IMPORT_TEMPLATE}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '排放源导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}
