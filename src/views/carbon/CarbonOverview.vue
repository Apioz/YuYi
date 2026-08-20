<template>
  <CarbonPageShell page-title="碳核算总览" show-report-toolbar>
    <div class="overview-stats carbon-mb-12">
      <div
        v-for="(kpi, index) in overviewData.kpis"
        :key="kpi.label"
        class="overview-stat-card"
      >
        <div
          class="overview-stat-icon"
          :style="{
            background: `${kpi.color}12`,
            color: kpi.color,
            borderColor: `${kpi.color}30`
          }"
        >
          {{ kpiIcons[index] }}
        </div>
        <div class="overview-stat-body">
          <div class="overview-stat-value" :style="{ color: kpi.color }">
            {{ kpi.value }}<span class="overview-stat-unit">{{ kpi.unit }}</span>
          </div>
          <div class="overview-stat-label" :title="kpi.label">{{ kpi.label }}</div>
          <div class="overview-stat-trend">{{ kpi.trend === '—' ? '' : kpi.trend }}</div>
        </div>
      </div>
    </div>

    <div class="carbon-card period-bar carbon-mb-12">
      <div class="period-left">
        <span class="period-label">统计周期</span>
        <el-radio-group v-model="periodType" size="default">
          <el-radio-button value="month">月度</el-radio-button>
          <el-radio-button value="quarter">季度</el-radio-button>
        </el-radio-group>
        <el-select v-if="periodType === 'month'" v-model="selectedMonth" style="width: 120px">
          <el-option v-for="m in 12" :key="m" :label="`${m}月${m === currentMonth ? '（当月）' : ''}`" :value="m" />
        </el-select>
        <el-select v-else v-model="selectedQuarter" style="width: 140px">
          <el-option v-for="q in 4" :key="q" :label="`${q}季度${q === currentQuarter ? '（当季）' : ''}`" :value="q" />
        </el-select>
        <span class="period-hint">{{ periodHint }}</span>
      </div>
    </div>

    <div v-if="thresholdAlerts.length" class="carbon-card alert-panel carbon-mb-12">
      <div class="alert-head">
        <h3 class="carbon-card-title">活动数据阈值告警</h3>
        <el-tag type="danger" size="small" effect="dark">{{ thresholdAlerts.length }} 条超限</el-tag>
      </div>
      <p class="alert-desc">以下告警来自活动数据采集的月度/年度阈值监控。月度/年度为周期内累计碳值，仅<strong>超过指标上限</strong>时在此提示。</p>
      <div class="alert-table-wrap" :class="{ 'is-expanded': alertExpanded }">
        <table class="carbon-table">
          <thead>
            <tr>
              <th>阈值类型</th>
              <th>监测周期</th>
              <th>排放源</th>
              <th>累计碳值 (tCO₂e)</th>
              <th>阈值范围</th>
              <th>监控状态</th>
              <th>最近更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in displayedThresholdAlerts" :key="row.id" class="alert-row">
              <td>{{ row.thresholdType }}</td>
              <td>{{ row.monitorPeriod }}</td>
              <td>{{ row.source }}</td>
              <td class="alert-value">{{ row.carbonValue }}</td>
              <td>{{ formatThresholdRange(row, row.thresholdType === '年度' ? 'annual' : 'monthly') }}</td>
              <td><CarbonThresholdTag :status="row.thresholdStatus" /></td>
              <td>{{ row.updated }}</td>
              <td><span class="carbon-link" @click="goActivity">查看明细</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="thresholdAlerts.length > ALERT_DEFAULT_COUNT" class="alert-more-bar">
        <span class="carbon-link" @click="toggleAlertExpand">
          {{ alertExpanded ? '收起' : `更多（共 ${Math.min(thresholdAlerts.length, ALERT_MAX_COUNT)} 条）` }}
        </span>
      </div>
    </div>

    <div class="carbon-grid-2 carbon-mb-12">
      <div class="carbon-card structure-card">
        <el-tabs v-model="structureTab" class="structure-tabs">
          <el-tab-pane :label="`排放结构（${overviewData.periodLabel}）`" name="emission">
            <div class="donut-wrap">
              <div
                class="donut-chart"
                :style="{ background: `conic-gradient(${overviewData.donutGradient})` }"
              >
                <div class="donut-center">
                  <div class="donut-total">{{ formatNumber(overviewData.total) }}</div>
                  <div class="donut-unit">tCO₂e</div>
                </div>
              </div>
              <ul class="donut-legend">
                <li v-for="item in overviewData.structure" :key="item.name">
                  <span class="legend-dot" :style="{ background: item.color }" />
                  <span>{{ item.name }}</span>
                  <span class="legend-val">{{ item.value.toLocaleString() }} ({{ item.percent }})</span>
                </li>
              </ul>
            </div>
          </el-tab-pane>
          <el-tab-pane label="数据质量等级分布" name="quality">
            <div class="donut-wrap">
              <div
                class="donut-chart"
                :style="{ background: `conic-gradient(${qualityDonutGradient})` }"
              >
                <div class="donut-center">
                  <div class="donut-total">{{ qualityTotalCount }}</div>
                  <div class="donut-unit">数据项</div>
                </div>
              </div>
              <ul class="donut-legend">
                <li v-for="item in qualityDistribution" :key="item.label">
                  <span class="legend-dot" :style="{ background: item.color }" />
                  <span><CarbonQualityTag :label="item.label" /></span>
                  <span class="legend-val">{{ item.count }} 项 ({{ item.percent }}%)</span>
                </li>
              </ul>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="carbon-card">
        <h3 class="carbon-card-title">{{ trendTitle }}</h3>
        <div class="bar-chart">
          <div class="bar-y-label">tCO₂e</div>
          <div class="bar-area">
            <div
              v-for="(val, idx) in overviewData.trendData"
              :key="idx"
              class="bar-item"
              :style="{ height: `${(val / maxTrend) * 100}%` }"
              :title="`${trendLabels[idx]}: ${val}`"
            />
          </div>
          <div class="bar-x-labels">
            <span v-for="(label, idx) in trendLabels" :key="idx">{{ label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="carbon-card carbon-mb-12">
      <div class="table-head">
        <h3 class="carbon-card-title">数据质量明细</h3>
        <span class="table-sub">核算期：2024年度</span>
      </div>
      <div class="filter-bar">
        <el-input v-model="qualityFilters.source" placeholder="排放源" clearable style="width: 140px" />
        <el-select v-model="qualityFilters.quality" placeholder="质量等级" clearable style="width: 120px">
          <el-option label="实测" value="实测" />
          <el-option label="统计" value="统计" />
          <el-option label="估算" value="估算" />
        </el-select>
        <el-select v-model="qualityFilters.method" placeholder="采集方式" clearable style="width: 120px">
          <el-option label="自动采集" value="自动采集" />
          <el-option label="系统对接" value="系统对接" />
          <el-option label="手动录入" value="手动录入" />
        </el-select>
        <el-select v-model="qualityFilters.status" placeholder="状态" clearable style="width: 100px">
          <el-option label="正常" value="正常" />
          <el-option label="待审核" value="待审核" />
        </el-select>
        <el-button type="primary" @click="applyQualityFilters">搜索</el-button>
        <el-button @click="resetQualityFilters">清空</el-button>
      </div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源</th>
            <th>数据项</th>
            <th>质量等级</th>
            <th>采集方式</th>
            <th>最近校验</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayedQualityDetails" :key="`${row.source}-${row.item}`">
            <td>{{ row.source }}</td>
            <td>{{ row.item }}</td>
            <td><CarbonQualityTag :label="row.quality" /></td>
            <td>{{ row.method }}</td>
            <td>{{ row.checked }}</td>
            <td>
              <el-tag :type="row.status === '正常' ? 'success' : 'warning'" size="small" effect="light">
                {{ row.status }}
              </el-tag>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="carbon-card">
      <div class="table-head">
        <h3 class="carbon-card-title">排放源排放量排行 (Top 5)</h3>
        <span class="table-sub">基于排放源配置与活动数据汇总</span>
      </div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源</th>
            <th>类型</th>
            <th>GHG范围</th>
            <th>能源类型</th>
            <th>物料</th>
            <th>关联园区</th>
            <th>碳值 (tCO₂e)</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in topSources" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.sourceType }}</td>
            <td><CarbonScopeTag :scope="row.scope" /></td>
            <td>{{ row.energyType }}</td>
            <td>{{ row.material }}</td>
            <td>{{ row.park }}</td>
            <td>{{ row.carbonValue ?? row.energyValue }}</td>
            <td>{{ row.ratio }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonScopeTag from '@/components/carbon/CarbonScopeTag.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'
import { qualityDetails, qualityDistribution } from '@/data/carbonMock'

const router = useRouter()
const { emissionSourceList, activityDataWithThreshold, thresholdAlerts, getOverviewData, formatNumber, parseNumeric, formatThresholdRange } = useCarbonBusiness()

const currentMonth = 12
const currentQuarter = 4

const periodType = ref('month')
const selectedMonth = ref(currentMonth)
const selectedQuarter = ref(currentQuarter)
const structureTab = ref('emission')
const alertExpanded = ref(false)

const ALERT_DEFAULT_COUNT = 5
const ALERT_MAX_COUNT = 10

const kpiIcons = ['T', '1', '2', '3', 'Q']

const displayedThresholdAlerts = computed(() => {
  const limit = alertExpanded.value ? ALERT_MAX_COUNT : ALERT_DEFAULT_COUNT
  return thresholdAlerts.value.slice(0, limit)
})

function toggleAlertExpand() {
  alertExpanded.value = !alertExpanded.value
}

const qualityTotalCount = computed(() =>
  qualityDistribution.reduce((sum, item) => sum + item.count, 0)
)

const qualityDonutGradient = computed(() => {
  let start = 0
  return qualityDistribution
    .map((item) => {
      const end = start + item.percent
      const segment = `${item.color} ${start}% ${end}%`
      start = end
      return segment
    })
    .join(', ')
})

const qualityFilters = reactive({ source: '', quality: '', method: '', status: '' })
const appliedQualityFilters = reactive({ source: '', quality: '', method: '', status: '' })

function applyQualityFilters() {
  Object.assign(appliedQualityFilters, { ...qualityFilters })
}

function resetQualityFilters() {
  Object.keys(qualityFilters).forEach((key) => { qualityFilters[key] = '' })
  Object.keys(appliedQualityFilters).forEach((key) => { appliedQualityFilters[key] = '' })
}

const displayedQualityDetails = computed(() =>
  qualityDetails.filter((row) => {
    if (appliedQualityFilters.source.trim() && !row.source.includes(appliedQualityFilters.source.trim())) return false
    if (appliedQualityFilters.quality && row.quality !== appliedQualityFilters.quality) return false
    if (appliedQualityFilters.method && row.method !== appliedQualityFilters.method) return false
    if (appliedQualityFilters.status && row.status !== appliedQualityFilters.status) return false
    return true
  })
)

const overviewData = computed(() =>
  getOverviewData({
    periodType: periodType.value,
    month: selectedMonth.value,
    quarter: selectedQuarter.value
  })
)

const periodHint = computed(() => {
  if (periodType.value === 'month') {
    return selectedMonth.value === currentMonth ? '当前展示当月数据' : '历史月份数据'
  }
  return selectedQuarter.value === currentQuarter ? '当前展示当季度数据' : '历史季度数据'
})

const maxTrend = computed(() => Math.max(...overviewData.value.trendData, 1))

const trendTitle = computed(() =>
  periodType.value === 'month' ? '2024年度月度排放趋势' : `${selectedQuarter.value}季度月度分解`
)

const trendLabels = computed(() => {
  if (periodType.value === 'month') {
    return overviewData.value.trendData.map((_, idx) => idx + 1)
  }
  const start = (selectedQuarter.value - 1) * 3 + 1
  return [start, start + 1, start + 2]
})

const topSources = computed(() => {
  const totals = new Map()
  for (const act of activityDataWithThreshold.value) {
    if (!act.hasData) continue
    const n = act.carbonNumeric ?? parseNumeric(act.carbonValue)
    if (!Number.isNaN(n)) {
      totals.set(act.sourceId, (totals.get(act.sourceId) ?? 0) + n)
    }
  }
  const grandTotal = [...totals.values()].reduce((sum, n) => sum + n, 0)

  return [...emissionSourceList.value]
    .map((s) => {
      const emissionNum = totals.get(s.id) ?? 0
      return {
        ...s,
        carbonValue: formatNumber(emissionNum),
        emissionNum
      }
    })
    .filter((s) => s.emissionNum > 0)
    .sort((a, b) => b.emissionNum - a.emissionNum)
    .slice(0, 5)
    .map((s) => ({
      ...s,
      ratio: grandTotal > 0 ? `${((s.emissionNum / grandTotal) * 100).toFixed(1)}%` : '0%'
    }))
})

function goActivity() {
  router.push('/carbon/activity')
}
</script>

<style scoped>
.period-bar { padding: 12px 16px; }
.period-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.period-label { font-size: 13px; color: var(--yy-text-secondary); font-weight: 500; }
.period-hint { font-size: 12px; color: var(--yy-text-placeholder); }

.alert-panel { border-left: 3px solid #ff4d4f; }
.alert-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.alert-head .carbon-card-title { margin-bottom: 0; }
.alert-desc { font-size: 13px; color: var(--yy-text-secondary); margin: 0 0 12px; }
.alert-table-wrap.is-expanded {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--yy-border);
  border-radius: 4px;
}
.alert-table-wrap.is-expanded .carbon-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fafafa;
}
.alert-more-bar {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}
.alert-row td { background: #fff7f7; }
.alert-value { color: #ff4d4f; font-weight: 600; }

.overview-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.overview-stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 76px;
  padding: 12px 14px;
  background: var(--yy-bg-white);
  border: 1px solid var(--yy-border);
  border-radius: 4px;
}

.overview-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}

.overview-stat-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.overview-stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overview-stat-unit {
  font-size: 12px;
  font-weight: 500;
  margin-left: 3px;
  opacity: 0.85;
}

.overview-stat-label {
  margin-top: 3px;
  font-size: 12px;
  color: var(--yy-text-secondary);
  line-height: 1.35;
  min-height: 33px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.overview-stat-trend {
  min-height: 16px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--yy-text-placeholder);
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.structure-card { padding-top: 4px; }
.structure-tabs :deep(.el-tabs__header) { margin-bottom: 12px; }
.structure-tabs :deep(.el-tabs__item) { font-size: 13px; }

.donut-wrap { display: flex; align-items: center; gap: 24px; min-height: 200px; }
.donut-chart { width: 160px; height: 160px; border-radius: 50%; position: relative; flex-shrink: 0; }
.donut-center {
  position: absolute; inset: 28px; border-radius: 50%; background: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: inset 0 0 0 1px var(--yy-border);
}
.donut-total { font-size: 18px; font-weight: 700; }
.donut-unit { font-size: 11px; color: var(--yy-text-secondary); }
.donut-legend { list-style: none; margin: 0; padding: 0; flex: 1; }
.donut-legend li { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-val { margin-left: auto; color: var(--yy-text-secondary); }

.bar-chart { padding-top: 8px; }
.bar-y-label { font-size: 11px; color: var(--yy-text-placeholder); margin-bottom: 8px; }
.bar-area {
  display: flex; align-items: flex-end; gap: 6px; height: 160px;
  border-bottom: 1px dashed var(--yy-border); padding-bottom: 4px;
}
.bar-item {
  flex: 1; background: linear-gradient(180deg, #69c0ff 0%, #1890ff 100%);
  border-radius: 3px 3px 0 0; min-height: 4px;
}
.bar-x-labels {
  display: flex; justify-content: space-between; margin-top: 8px;
  font-size: 11px; color: var(--yy-text-placeholder);
}

.table-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; gap: 12px; flex-wrap: wrap; }
.table-head .carbon-card-title { margin-bottom: 0; }
.table-sub { font-size: 12px; color: var(--yy-text-placeholder); }

@media (max-width: 1200px) {
  .overview-stats { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .overview-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .overview-stats { grid-template-columns: 1fr; }
}
</style>
