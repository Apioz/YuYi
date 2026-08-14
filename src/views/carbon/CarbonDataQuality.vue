<template>
  <CarbonPageShell page-title="数据质量">
    <div class="carbon-grid-4 carbon-mb-12">
      <div v-for="item in qualityKpis" :key="item.label" class="carbon-card kpi-card">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}<span class="kpi-unit">{{ item.unit }}</span></div>
        <div class="kpi-trend">{{ item.trend }}</div>
      </div>
    </div>

    <div class="carbon-grid-2 carbon-mb-12">
      <div class="carbon-card">
        <h3 class="carbon-card-title">数据质量等级分布</h3>
        <div v-for="item in qualityDistribution" :key="item.label" class="dist-row">
          <span class="dist-label"><CarbonQualityTag :label="item.label" /></span>
          <div class="dist-bar-wrap">
            <div class="dist-bar" :style="{ width: `${item.percent}%`, background: item.color }" />
          </div>
          <span class="dist-val">{{ item.count }} 项 ({{ item.percent }}%)</span>
        </div>
      </div>

      <div class="carbon-card">
        <h3 class="carbon-card-title">数据采集方式质量</h3>
        <table class="carbon-table">
          <thead>
            <tr>
              <th>采集方式</th>
              <th>数据项数</th>
              <th>主要质量等级</th>
              <th>完整率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in collectionQuality" :key="row.method">
              <td>{{ row.method }}</td>
              <td>{{ row.count }}</td>
              <td><CarbonQualityTag :label="row.quality" /></td>
              <td>{{ row.rate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">数据质量明细</span>
          <span class="toolbar-sub">核算期：2024年度</span>
        </div>
        <div class="toolbar-right">
          <el-select placeholder="全部质量等级" style="width: 130px">
            <el-option label="全部质量等级" value="" />
            <el-option label="实测" value="实测" />
            <el-option label="统计" value="统计" />
            <el-option label="估算" value="估算" />
          </el-select>
        </div>
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
          <tr v-for="row in qualityDetails" :key="`${row.source}-${row.item}`">
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
  </CarbonPageShell>
</template>

<script setup>
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'

const qualityKpis = [
  { label: '数据完整度', value: '92.5', unit: '%', trend: '↑ 4.2%' },
  { label: '实测数据占比', value: '71.4', unit: '%', trend: '↑ 2.1%' },
  { label: '待审核数据', value: '1', unit: '项', trend: '员工通勤里程' },
  { label: '数据缺口', value: '0', unit: '项', trend: '较上期 -1' }
]

const qualityDistribution = [
  { label: '实测', count: 5, percent: 71, color: '#52c41a' },
  { label: '统计', count: 1, percent: 14, color: '#faad14' },
  { label: '估算', count: 1, percent: 14, color: '#ff4d4f' }
]

const collectionQuality = [
  { method: '自动采集', count: 5, quality: '实测', rate: '100%' },
  { method: '系统对接', count: 1, quality: '统计', rate: '100%' },
  { method: '手动录入', count: 2, quality: '估算', rate: '50%' }
]

const qualityDetails = [
  { source: '1#回转窑', item: '电煤消耗量', quality: '实测', method: '自动采集', checked: '2024-12-31 23:59', status: '正常' },
  { source: '2#回转窑', item: '电煤消耗量', quality: '实测', method: '自动采集', checked: '2024-12-31 23:59', status: '正常' },
  { source: '外购蒸汽', item: '外购蒸汽量', quality: '统计', method: '系统对接', checked: '2024-12-30 18:00', status: '正常' },
  { source: '厂内运输车队', item: '柴油消耗量', quality: '统计', method: '手动录入', checked: '2024-12-29 14:30', status: '正常' },
  { source: '全体员工', item: '员工通勤里程', quality: '估算', method: '手动录入', checked: '2024-12-28 10:15', status: '待审核' }
]
</script>

<style scoped>
.kpi-card { padding: 14px 16px; }
.kpi-label { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-unit { font-size: 14px; font-weight: 400; margin-left: 4px; color: var(--yy-text-secondary); }
.kpi-trend { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 6px; }
.dist-row {
  display: grid; grid-template-columns: 72px 1fr 120px; gap: 10px;
  align-items: center; margin-bottom: 12px; font-size: 13px;
}
.dist-bar-wrap { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.dist-bar { height: 100%; border-radius: 4px; }
.dist-val { color: var(--yy-text-secondary); font-size: 12px; text-align: right; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; gap: 8px; }
</style>
