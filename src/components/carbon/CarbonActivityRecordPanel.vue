<template>
  <div class="activity-record-panel">
    <div class="activity-record-meta">
      <div class="meta-item">
        <span class="meta-label">数据采集</span>
        <CarbonQualityTag :label="source.collection" />
      </div>
      <div class="meta-item">
        <span class="meta-label">采集频率</span>
        <span>{{ source.collectionFrequency }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">监控起始</span>
        <span>{{ source.monitoredAt }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">历史记录</span>
        <span>{{ records.length }} 条</span>
      </div>
    </div>

    <div class="activity-record-tabs">
      <button
        v-for="item in measures"
        :key="item.key"
        type="button"
        class="activity-record-tab"
        :class="{ active: activeKey === item.key }"
        @click="activeKey = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="activity-record-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">数据间隔:</span>
        <el-select v-model="dataInterval" style="width: 88px" @change="handleIntervalChange">
          <el-option v-for="opt in intervalOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>

        <template v-if="showDatePicker">
          <span class="toolbar-label">时间:</span>
          <el-date-picker
            v-if="datePickerType === 'month'"
            v-model="anchorDate"
            type="month"
            value-format="YYYY-MM"
            :clearable="false"
            style="width: 140px"
            @change="handleDateChange"
          />
          <el-date-picker
            v-else-if="datePickerType === 'year'"
            v-model="anchorDate"
            type="year"
            value-format="YYYY"
            :clearable="false"
            style="width: 120px"
            @change="handleDateChange"
          />
        </template>

        <template v-if="showAgg">
          <span class="toolbar-label">数据类型:</span>
          <el-select v-model="agg" style="width: 96px">
            <el-option v-for="opt in aggOptions" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </template>

        <span class="live-text">{{ source.source }} 实时读数: {{ readingData.liveDisplay }}</span>
        <span v-if="showNav" class="period-text">当前时段: {{ readingData.periodLabel }}</span>
      </div>

      <div class="toolbar-right">
        <el-button type="primary" @click="queryTick++">查询</el-button>
        <el-button @click="handleClear">清空</el-button>
        <template v-if="showNav">
          <el-button :icon="ArrowLeft" @click="handleShift(-1)" />
          <el-button :icon="ArrowRight" @click="handleShift(1)" />
        </template>
      </div>
    </div>

    <div class="activity-record-chart">
      <div v-if="!records.length" class="chart-empty">暂无数据{{ emptyHint }}</div>
      <div v-else ref="chartRef" class="chart-canvas" />
    </div>

    <div v-if="dataTable" class="activity-record-table-wrap">
      <table class="carbon-table activity-record-table">
        <thead>
          <tr>
            <th rowspan="2">测量量名称</th>
            <th colspan="2">最大值</th>
            <th colspan="2">最小值</th>
            <th v-for="label in dataTable.slotLabels" :key="label" rowspan="2">{{ label }}</th>
          </tr>
          <tr>
            <th>数值</th>
            <th>时间点</th>
            <th>数值</th>
            <th>时间点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ dataTable.row.name }}</td>
            <td>{{ dataTable.row.maxVal }}</td>
            <td>{{ dataTable.row.maxTime }}</td>
            <td>{{ dataTable.row.minVal }}</td>
            <td>{{ dataTable.row.minTime }}</td>
            <td v-for="label in dataTable.slotLabels" :key="label">{{ dataTable.row[label] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="records.length" class="activity-record-list">
      <div class="list-title">明细记录</div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>记录周期</th>
            <th>能值</th>
            <th>碳值 (tCO₂e)</th>
            <th>计算公式</th>
            <th>记录来源</th>
            <th>记录时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in detailRecords" :key="rec.id">
            <td>{{ rec.recordPeriod }}</td>
            <td>{{ rec.energyValue }} {{ rec.unit }}</td>
            <td>{{ rec.carbonValue }}</td>
            <td class="formula-cell">{{ rec.calcFormula }}</td>
            <td>{{ rec.recordSource }}</td>
            <td>{{ rec.updated }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'
import {
  AGG_OPTIONS,
  getDefaultInterval,
  getIntervalOptions,
  defaultAnchor,
  resolveActivityRecordData,
  buildActivityChartOption,
  buildActivityDataTable
} from '@/composables/useActivityRecordChart'

const props = defineProps({
  source: { type: Object, required: true },
  records: { type: Array, default: () => [] }
})

const measures = computed(() => [
  {
    key: 'energy',
    label: '能值',
    unit: props.records[0]?.unit ?? props.source.unit ?? '',
    accent: '#1890ff'
  },
  {
    key: 'carbon',
    label: '碳值',
    unit: 'tCO₂e',
    accent: '#1dbf73'
  }
])

const activeKey = ref('energy')
const dataInterval = ref(getDefaultInterval(props.source.collection))
const agg = ref('采样值')
const anchorDate = ref(defaultAnchor(dataInterval.value))
const queryTick = ref(0)
const chartRef = ref(null)
let chartInstance = null

const intervalOptions = computed(() => getIntervalOptions(props.source.collection))
const aggOptions = AGG_OPTIONS
const showDatePicker = computed(() => dataInterval.value === '日' || dataInterval.value === '月')
const showAgg = computed(() => dataInterval.value !== '实时')
const showNav = computed(() => dataInterval.value !== '实时')
const datePickerType = computed(() => (dataInterval.value === '日' ? 'month' : 'year'))

const activeMeasure = computed(() => measures.value.find((m) => m.key === activeKey.value) ?? measures.value[0])

const readingData = computed(() => {
  queryTick.value
  return resolveActivityRecordData(
    props.records,
    activeMeasure.value,
    dataInterval.value,
    anchorDate.value,
    agg.value
  )
})

const chartOption = computed(() => {
  if (!props.records.length || !readingData.value.slots.length) return null
  return buildActivityChartOption(activeMeasure.value, readingData.value.slots)
})

const dataTable = computed(() => {
  if (dataInterval.value === '实时' || !readingData.value.slots.length) return null
  const table = buildActivityDataTable(activeMeasure.value, readingData.value)
  return table
})

const detailRecords = computed(() =>
  [...props.records].sort((a, b) => String(b.recordPeriod).localeCompare(String(a.recordPeriod)))
)

const emptyHint = computed(() =>
  props.source.collection === '手动录入' ? '，请通过「导入数据记录」录入' : ''
)

function handleIntervalChange() {
  agg.value = '采样值'
  anchorDate.value = defaultAnchor(dataInterval.value)
  queryTick.value++
}

function handleDateChange() {
  queryTick.value++
}

function handleClear() {
  dataInterval.value = getDefaultInterval(props.source.collection)
  agg.value = '采样值'
  anchorDate.value = defaultAnchor(dataInterval.value)
  activeKey.value = 'energy'
  queryTick.value++
}

function shiftMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftYear(year, delta) {
  return String(Number(year) + delta)
}

function handleShift(delta) {
  if (dataInterval.value === '日' && anchorDate.value) {
    anchorDate.value = shiftMonth(anchorDate.value, delta)
  } else if ((dataInterval.value === '月' || dataInterval.value === '年') && anchorDate.value) {
    anchorDate.value = shiftYear(anchorDate.value, delta)
  }
  queryTick.value++
}

function renderChart() {
  if (!chartRef.value || !chartOption.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  chartInstance.setOption(chartOption.value, true)
}

function disposeChart() {
  chartInstance?.dispose()
  chartInstance = null
}

watch(
  () => [props.source, props.records],
  () => {
    dataInterval.value = getDefaultInterval(props.source.collection)
    anchorDate.value = defaultAnchor(dataInterval.value)
    agg.value = '采样值'
    activeKey.value = 'energy'
    queryTick.value++
  },
  { deep: true }
)

watch(chartOption, async () => {
  await nextTick()
  if (!props.records.length) {
    disposeChart()
    return
  }
  renderChart()
})

onMounted(async () => {
  await nextTick()
  renderChart()
  window.addEventListener('resize', renderChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart)
  disposeChart()
})
</script>

<style scoped>
.activity-record-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.activity-record-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: var(--yy-text-placeholder);
}

.activity-record-tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 12px 16px 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.activity-record-tab {
  padding: 6px 14px;
  margin: 0 0 -1px;
  border: 1px solid #d9d9d9;
  border-right: none;
  background: #fff;
  color: rgba(0, 0, 0, 0.85);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.activity-record-tab:first-child {
  border-radius: 4px 0 0 0;
}

.activity-record-tab:last-child {
  border-right: 1px solid #d9d9d9;
  border-radius: 0 4px 0 0;
}

.activity-record-tab.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
  z-index: 1;
}

.activity-record-tab:not(.active):hover {
  color: #1890ff;
}

.activity-record-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.live-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.period-text {
  font-size: 13px;
  color: #1890ff;
}

.activity-record-chart {
  padding: 8px 12px 4px;
  background: #fff;
  min-height: 320px;
}

.chart-canvas {
  width: 100%;
  height: 320px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  color: rgba(0, 0, 0, 0.25);
  font-size: 14px;
}

.activity-record-table-wrap {
  padding: 0 16px 16px;
  background: #fff;
  overflow-x: auto;
}

.activity-record-table {
  font-size: 12px;
}

.activity-record-table th,
.activity-record-table td {
  text-align: center;
  padding: 6px 8px;
}

.activity-record-list {
  padding: 0 16px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.list-title {
  font-size: 13px;
  font-weight: 600;
  padding: 12px 0 8px;
}

.formula-cell {
  font-size: 12px;
  color: var(--yy-text-secondary);
  max-width: 180px;
}
</style>
