<template>
  <CarbonPageShell page-title="碳核算总览" show-report-toolbar>
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
      <p class="alert-desc">以下数据来自活动数据采集的阈值监控，超出设定范围将在总览中提示。</p>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>数据项</th>
            <th>排放源</th>
            <th>监测能值</th>
            <th>碳值 (tCO₂e)</th>
            <th>阈值范围</th>
            <th>监控状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in thresholdAlerts" :key="row.id" class="alert-row">
            <td>{{ row.item }}</td>
            <td>{{ row.source }}</td>
            <td>{{ row.energyValue }} {{ row.unit }}</td>
            <td class="alert-value">{{ row.carbonValue }} tCO₂e</td>
            <td>{{ formatThresholdRange(row) }}</td>
            <td><CarbonThresholdTag :status="row.thresholdStatus" /></td>
            <td>{{ row.updated }}</td>
            <td><span class="carbon-link" @click="goActivity">查看明细</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="carbon-grid-5 carbon-mb-12">
      <div
        v-for="kpi in overviewData.kpis"
        :key="kpi.label"
        class="carbon-card kpi-card"
        :style="{ borderBottom: `3px solid ${kpi.color}` }"
      >
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value">
          {{ kpi.value }}<span class="kpi-unit">{{ kpi.unit }}</span>
        </div>
        <div class="kpi-trend">{{ kpi.trend }}</div>
      </div>
    </div>

    <div class="carbon-grid-2 carbon-mb-12">
      <div class="carbon-card">
        <h3 class="carbon-card-title">排放结构（{{ overviewData.periodLabel }}）</h3>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonScopeTag from '@/components/carbon/CarbonScopeTag.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'

const router = useRouter()
const { emissionSourceList, activityDataWithThreshold, thresholdAlerts, getOverviewData, formatNumber, parseNumeric } = useCarbonBusiness()

const currentMonth = 12
const currentQuarter = 4

const periodType = ref('month')
const selectedMonth = ref(currentMonth)
const selectedQuarter = ref(currentQuarter)

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

function formatThresholdRange(row) {
  const parts = []
  if (row.thresholdMin != null) parts.push(`≥ ${row.thresholdMin.toLocaleString()}`)
  if (row.thresholdMax != null) parts.push(`≤ ${row.thresholdMax.toLocaleString()}`)
  return parts.join('，') || '—'
}

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
.alert-row td { background: #fff7f7; }
.alert-value { color: #ff4d4f; font-weight: 600; }

.kpi-card { padding: 14px 16px; }
.kpi-label { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 700; line-height: 1.2; color: var(--yy-text-primary); }
.kpi-unit { font-size: 14px; font-weight: 400; margin-left: 4px; color: var(--yy-text-secondary); }
.kpi-trend { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 6px; }

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
</style>
