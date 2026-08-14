/** 活动数据记录图表数据解析（参照生物芯片仪表数据） */

const INTERVAL_BY_COLLECTION = {
  自动采集: ['实时', '日', '月'],
  系统对接: ['月', '年'],
  手动录入: ['月', '年']
}

const AGG_OPTIONS = ['采样值', '最大值', '最小值', '平均值']

function parseNumeric(value) {
  if (value == null || value === '') return NaN
  return Number(String(value).replace(/,/g, ''))
}

function formatNum(num, digits = 2) {
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function parsePeriod(period) {
  const s = String(period ?? '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { kind: 'day', value: s }
  if (/^\d{4}-\d{2}$/.test(s)) return { kind: 'month', value: s }
  if (/^\d{4}$/.test(s)) return { kind: 'year', value: s }
  return { kind: 'unknown', value: s }
}

function defaultAnchor(interval) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  if (interval === '日') return `${y}-${m}`
  if (interval === '月' || interval === '年') return String(y)
  return ''
}

function monthDays(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return `${yearMonth}-${d}`
  })
}

function monthLabels() {
  return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
}

function aggregateValues(values, agg) {
  const nums = values.filter((v) => !Number.isNaN(v))
  if (!nums.length) return NaN
  if (agg === '最大值') return Math.max(...nums)
  if (agg === '最小值') return Math.min(...nums)
  if (agg === '平均值') return nums.reduce((a, b) => a + b, 0) / nums.length
  return nums[nums.length - 1]
}

function buildSummary(slots) {
  const valid = slots.filter((s) => !s.isFuture && !Number.isNaN(s.numeric))
  if (!valid.length) {
    return { maxValue: '—', maxTime: '—', minValue: '—', minTime: '—' }
  }
  let maxSlot = valid[0]
  let minSlot = valid[0]
  for (const s of valid) {
    if (s.numeric > maxSlot.numeric) maxSlot = s
    if (s.numeric < minSlot.numeric) minSlot = s
  }
  return {
    maxValue: formatNum(maxSlot.numeric),
    maxTime: maxSlot.label,
    minValue: formatNum(minSlot.numeric),
    minTime: minSlot.label
  }
}

function getRecordValue(record, measureKey) {
  if (measureKey === 'carbon') return parseNumeric(record.carbonNumeric ?? record.carbonValue)
  return parseNumeric(record.numericValue ?? record.energyValue)
}

function sortRecords(records) {
  return [...records].sort((a, b) => String(a.recordPeriod).localeCompare(String(b.recordPeriod)))
}

export function getIntervalOptions(collection) {
  return INTERVAL_BY_COLLECTION[collection] ?? ['月', '年']
}

export function getDefaultInterval(collection) {
  return getIntervalOptions(collection)[0]
}

export { AGG_OPTIONS, defaultAnchor }

export function resolveActivityRecordData(records, measure, interval, anchor, agg) {
  const sorted = sortRecords(records)
  const getValue = (rec) => getRecordValue(rec, measure.key)

  if (!sorted.length) {
    return {
      slots: [],
      summary: { maxValue: '—', maxTime: '—', minValue: '—', minTime: '—' },
      periodLabel: '',
      liveDisplay: '—'
    }
  }

  const latest = sorted[sorted.length - 1]
  const unit = measure.unit ?? ''
  const liveVal = getValue(latest)
  const liveDisplay = Number.isNaN(liveVal) ? '—' : `${formatNum(liveVal)}${unit ? ` ${unit}` : ''}`

  if (interval === '实时') {
    const recent = sorted.slice(-12)
    const slots = recent.map((rec) => {
      const parsed = parsePeriod(rec.recordPeriod)
      const label = parsed.kind === 'day' ? rec.recordPeriod.slice(5) : rec.recordPeriod
      const numeric = getValue(rec)
      return { label, value: Number.isNaN(numeric) ? '—' : formatNum(numeric), numeric, isFuture: false }
    })
    return { slots, summary: buildSummary(slots), periodLabel: '最近记录', liveDisplay }
  }

  if (interval === '日') {
    const yearMonth = anchor || defaultAnchor('日')
    const days = monthDays(yearMonth)
    const byDay = new Map()
    for (const rec of sorted) {
      const parsed = parsePeriod(rec.recordPeriod)
      if (parsed.kind === 'day' && rec.recordPeriod.startsWith(yearMonth)) {
        byDay.set(rec.recordPeriod, getValue(rec))
      }
    }
    const slots = days.map((day) => {
      const numeric = byDay.has(day) ? byDay.get(day) : NaN
      const label = day.slice(8)
      return {
        label,
        value: Number.isNaN(numeric) ? '0' : formatNum(numeric),
        numeric: Number.isNaN(numeric) ? NaN : numeric,
        isFuture: false
      }
    })
    return { slots, summary: buildSummary(slots), periodLabel: yearMonth, liveDisplay }
  }

  if (interval === '月') {
    const year = anchor || defaultAnchor('月')
    const byMonth = new Map()
    for (const rec of sorted) {
      const parsed = parsePeriod(rec.recordPeriod)
      if (parsed.kind === 'month' && rec.recordPeriod.startsWith(year)) {
        byMonth.set(rec.recordPeriod, getValue(rec))
      } else if (parsed.kind === 'day' && rec.recordPeriod.startsWith(year)) {
        const monthKey = rec.recordPeriod.slice(0, 7)
        const vals = byMonth.get(monthKey) ?? []
        vals.push(getValue(rec))
        byMonth.set(monthKey, vals)
      }
    }
    const slots = monthLabels().map((mm) => {
      const key = `${year}-${mm}`
      const raw = byMonth.get(key)
      let numeric = NaN
      if (Array.isArray(raw)) numeric = aggregateValues(raw, agg)
      else if (raw != null) numeric = raw
      return {
        label: `${mm}月`,
        value: Number.isNaN(numeric) ? '0' : formatNum(numeric),
        numeric: Number.isNaN(numeric) ? NaN : numeric,
        isFuture: false
      }
    })
    return { slots, summary: buildSummary(slots), periodLabel: `${year}年`, liveDisplay }
  }

  if (interval === '年') {
    const byYear = new Map()
    for (const rec of sorted) {
      const parsed = parsePeriod(rec.recordPeriod)
      const yearKey = parsed.kind === 'year' ? parsed.value : parsed.value.slice(0, 4)
      const vals = byYear.get(yearKey) ?? []
      vals.push(getValue(rec))
      byYear.set(yearKey, vals)
    }
    const years = [...byYear.keys()].sort()
    const slots = years.map((y) => {
      const numeric = aggregateValues(byYear.get(y), agg)
      return {
        label: `${y}年`,
        value: Number.isNaN(numeric) ? '0' : formatNum(numeric),
        numeric: Number.isNaN(numeric) ? NaN : numeric,
        isFuture: false
      }
    })
    return { slots, summary: buildSummary(slots), periodLabel: '历年汇总', liveDisplay }
  }

  return { slots: [], summary: buildSummary([]), periodLabel: '', liveDisplay }
}

export function buildActivityChartOption(measure, slots) {
  const unit = measure.unit ?? ''
  const color = measure.accent ?? '#1890ff'
  const values = slots.map((s) => (Number.isNaN(s.numeric) ? 0 : s.numeric))
  const labels = slots.map((s) => s.label)

  return {
    color: [color],
    grid: { left: 56, right: 24, top: 36, bottom: 48 },
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const idx = params[0]?.dataIndex ?? 0
        const slot = slots[idx]
        if (!slot) return ''
        if (Number.isNaN(slot.numeric)) return `${slot.label}<br/>无数据`
        return `${slot.label}<br/>${measure.label}: ${slot.value}${unit ? ` ${unit}` : ''}`
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: unit || undefined,
      nameTextStyle: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 }
    },
    series: [
      {
        name: measure.label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2 },
        areaStyle: { color: `${color}22` },
        data: values
      }
    ],
    legend: { bottom: 0, data: [measure.label], icon: 'circle' }
  }
}

export function buildActivityDataTable(measure, data) {
  const { slots, summary } = data
  if (!slots.length) return null

  const unit = measure.unit ?? ''
  const name = unit ? `${measure.label}(${unit})` : measure.label
  const row = {
    key: measure.key,
    name,
    maxVal: summary.maxValue,
    maxTime: summary.maxTime,
    minVal: summary.minValue,
    minTime: summary.minTime
  }
  slots.forEach((s) => {
    row[s.label] = Number.isNaN(s.numeric) ? '0' : String(s.value)
  })

  return { row, slotLabels: slots.map((s) => s.label) }
}
