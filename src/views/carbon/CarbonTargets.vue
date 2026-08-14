<template>
  <CarbonPageShell page-title="碳目标管理" show-report-toolbar>
    <div class="carbon-grid-3 carbon-mb-12">
      <div v-for="item in targetKpis" :key="item.label" class="carbon-card kpi-card">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}<span class="kpi-unit">{{ item.unit }}</span></div>
        <div class="kpi-sub">{{ item.sub }}</div>
      </div>
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">碳目标清单</span>
          <span class="toolbar-sub">2024年度</span>
        </div>
      </div>
      <div class="list-add-bar">
        <el-button type="primary">+ 新增目标</el-button>
      </div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>目标名称</th>
            <th>目标类型</th>
            <th>基准年</th>
            <th>目标值</th>
            <th>当前值</th>
            <th>完成率</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in targets" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.type }}</td>
            <td>{{ row.baseYear }}</td>
            <td>{{ row.target }}</td>
            <td>{{ row.current }}</td>
            <td>{{ row.rate }}</td>
            <td>
              <el-tag :type="row.statusType" size="small" effect="light">{{ row.status }}</el-tag>
            </td>
            <td><span class="carbon-link">详情</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'

const targetKpis = [
  { label: '年度减排目标', value: '5', unit: '%', sub: '较2023年基准' },
  { label: '当前完成进度', value: '62', unit: '%', sub: '距目标还差 3.8%' },
  { label: '碳强度目标', value: '0.75', unit: 'tCO₂e/万元', sub: '2024年目标值' }
]

const targets = [
  { name: '2024年度总量控制', type: '绝对量目标', baseYear: '2023', target: '18,600 tCO₂e', current: '19,605 tCO₂e', rate: '94.8%', status: '预警', statusType: 'warning' },
  { name: '2024碳强度下降', type: '强度目标', baseYear: '2023', target: '0.75 tCO₂e/万元', current: '0.82 tCO₂e/万元', rate: '91.5%', status: '进行中', statusType: 'primary' },
  { name: 'Scope 2 购电优化', type: '分项目标', baseYear: '2023', target: '700 tCO₂e', current: '765 tCO₂e', rate: '91.5%', status: '进行中', statusType: 'primary' }
]
</script>

<style scoped>
.kpi-card { padding: 14px 16px; }
.kpi-label { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-unit { font-size: 14px; font-weight: 400; margin-left: 4px; color: var(--yy-text-secondary); }
.kpi-sub { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 6px; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
</style>
