<template>
  <CarbonPageShell page-title="碳监测分析" show-report-toolbar>
    <div class="carbon-grid-4 carbon-mb-12">
      <div v-for="item in analysisKpis" :key="item.label" class="carbon-card kpi-card">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}<span class="kpi-unit">{{ item.unit }}</span></div>
      </div>
    </div>

    <div class="carbon-card carbon-mb-12">
      <h3 class="carbon-card-title">排放源类型分析</h3>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源类型</th>
            <th>排放量(tCO₂e)</th>
            <th>占比</th>
            <th>同比变化</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in typeRows" :key="row.type">
            <td>{{ row.type }}</td>
            <td>{{ row.value.toLocaleString() }}</td>
            <td>{{ row.percent }}%</td>
            <td>
              <el-tag :type="row.change.startsWith('-') ? 'success' : 'danger'" size="small" effect="light">
                {{ row.change }}
              </el-tag>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="carbon-card">
      <h3 class="carbon-card-title">月度排放趋势</h3>
      <div class="bar-area">
        <div
          v-for="(val, idx) in monthlyTrend"
          :key="idx"
          class="bar-item"
          :style="{ height: `${(val / 2000) * 100}%` }"
          :title="`${idx + 1}月: ${val}`"
        />
      </div>
      <div class="bar-x-labels">
        <span v-for="m in 12" :key="m">{{ m }}月</span>
      </div>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import { computed } from 'vue'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import { typeDistribution, monthlyTrend } from '@/data/carbonMock'

const analysisKpis = [
  { label: '总排放量', value: '19,605', unit: 'tCO₂e' },
  { label: '同比变化', value: '+3.2', unit: '%' },
  { label: '碳排放强度', value: '0.82', unit: 'tCO₂e/万元' },
  { label: 'Scope 1 占比', value: '94.4', unit: '%' }
]

const typeRows = computed(() =>
  typeDistribution.map((t) => ({
    ...t,
    change: t.type === '外购电力' ? '-5.1%' : '+2.8%'
  }))
)
</script>

<style scoped>
.kpi-card { padding: 14px 16px; }
.kpi-label { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-unit { font-size: 14px; font-weight: 400; margin-left: 4px; color: var(--yy-text-secondary); }
.bar-area {
  display: flex; align-items: flex-end; gap: 6px; height: 180px;
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
</style>
