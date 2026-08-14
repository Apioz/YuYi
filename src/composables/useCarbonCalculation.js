import { allEmissionFactors } from '@/data/carbonMock'

function formatNum(num) {
  if (num == null || Number.isNaN(num)) return '—'
  return num.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function parseFactorValue(factor) {
  return Number(String(factor?.value ?? '').replace(/,/g, ''))
}

/** 烟煤等综合因子：低位发热量 × 含碳量 × 44/12 × 氧化率 */
function computeCoalComposite(heatingFactor) {
  const lhv = parseFactorValue(heatingFactor)
  const carbonContent = parseFactorValue(allEmissionFactors.find((f) => f.id === 'nf-002'))
  const oxidRate = parseFactorValue(allEmissionFactors.find((f) => f.id === 'nf-003'))
  if ([lhv, carbonContent, oxidRate].some(Number.isNaN)) return 1.9003
  return lhv * carbonContent * (44 / 12) * (oxidRate / 100)
}

/**
 * 根据排放源活动监测值与关联因子计算碳排放
 * @returns {{ carbonNumeric: number, calcFormula: string }}
 */
export function calculateCarbonEmission(activityNumeric, factor, source) {
  if (activityNumeric == null || Number.isNaN(activityNumeric) || !factor) {
    return { carbonNumeric: NaN, calcFormula: '—' }
  }

  const val = parseFactorValue(factor)
  const unit = factor.unit ?? ''
  const activityUnit = source?.activityUnit ?? ''

  if (unit.includes('tCO₂/MWh')) {
    const carbon = (activityNumeric / 1000) * val
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} ÷ 1,000 × ${val} tCO₂/MWh`
    }
  }

  if (unit.includes('kgCO₂/m³')) {
    const carbon = (activityNumeric * val) / 1000
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${val} kgCO₂/m³ ÷ 1,000`
    }
  }

  if (unit.includes('kgCO₂/km')) {
    const carbon = (activityNumeric * val) / 1000
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${val} kgCO₂/km ÷ 1,000`
    }
  }

  if (unit.includes('tCO₂/t')) {
    const carbon = activityNumeric * val
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${val} tCO₂/t`
    }
  }

  if (source?.sourceType === '移动燃烧' && activityUnit === 'L') {
    const dieselFactor = 2.631
    const carbon = (activityNumeric * dieselFactor) / 1000
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} L × ${dieselFactor} kgCO₂/L ÷ 1,000`
    }
  }

  if (unit.includes('GJ/t')) {
    const composite = factor?.id === 'nf-001' ? 1.9003 : computeCoalComposite(factor)
    const carbon = activityNumeric * composite
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${composite} tCO₂e/${activityUnit || 't'}`
    }
  }

  if (unit.includes('GJ/10')) {
    const composite = 2.631
    const carbon = (activityNumeric * composite) / 1000
    return {
      carbonNumeric: carbon,
      calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${composite} kgCO₂/L ÷ 1,000`
    }
  }

  const carbon = activityNumeric * val
  return {
    carbonNumeric: carbon,
    calcFormula: `${formatNum(activityNumeric)} ${activityUnit} × ${val} ${unit}`
  }
}

export function enrichActivityRow(row, source, factor) {
  const activityNumeric = row.numericValue ?? Number(String(row.energyValue ?? '').replace(/,/g, ''))
  const { carbonNumeric, calcFormula } = calculateCarbonEmission(activityNumeric, factor, source)
  return {
    ...row,
    unit: source?.activityUnit ?? row.unit ?? '—',
    calcFormula,
    carbonNumeric: Number.isNaN(carbonNumeric) ? null : carbonNumeric,
    carbonValue: Number.isNaN(carbonNumeric) ? '—' : formatNum(carbonNumeric)
  }
}

export function defaultActivityUnit(sourceType, factor) {
  const unit = factor?.unit ?? ''
  if (unit.includes('MWh') || unit.includes('购电')) return 'kWh'
  if (unit.includes('m³')) return 'm³'
  if (unit.includes('km')) return 'km'
  if (unit.includes('GJ')) return sourceType === '外购热力' ? 'GJ' : 't'
  if (unit.includes('tCO₂/t')) return 't'
  if (sourceType === '固定燃烧') return 't'
  if (sourceType === '移动燃烧') return 'L'
  return '—'
}
