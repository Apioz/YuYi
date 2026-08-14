<template>
  <CarbonPageShell page-title="核算结果">
    <div class="steps-row carbon-mb-12">
      <div v-for="step in accountingSteps" :key="step.step" class="step-item">
        <div class="step-num" :style="{ background: step.color }">{{ step.step }}</div>
        <div class="step-label">{{ step.label }}</div>
        <div class="step-value">{{ step.value }}</div>
        <div v-if="step.step < 5" class="step-arrow">→</div>
      </div>
    </div>

    <div class="carbon-grid-4 carbon-mb-12">
      <div
        v-for="item in scopeSummaries"
        :key="item.label"
        class="carbon-card scope-card"
        :style="{ borderTop: `3px solid ${item.color}` }"
      >
        <div class="scope-label">{{ item.label }}</div>
        <div class="scope-value">{{ item.value }}</div>
        <div class="scope-detail">{{ item.detail }}</div>
      </div>
    </div>

    <div class="carbon-grid-2 carbon-mb-12">
      <div class="carbon-card">
        <h3 class="carbon-card-title">按排放源类型分布</h3>
        <div v-for="item in typeDistribution" :key="item.type" class="dist-row">
          <span class="dist-label">{{ item.type }}</span>
          <div class="dist-bar-wrap">
            <div class="dist-bar" :style="{ width: `${Math.min(item.percent, 100)}%`, background: item.color }" />
          </div>
          <span class="dist-val">{{ item.value.toLocaleString() }} t ({{ item.percent }}%)</span>
        </div>
      </div>

      <div class="carbon-card">
        <h3 class="carbon-card-title">核算计算明细</h3>
        <table class="carbon-table">
          <thead>
            <tr>
              <th>排放源</th>
              <th>活动数据</th>
              <th>× 因子</th>
              <th>= 排放量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in calculationDetails" :key="row.source">
              <td>{{ row.source }}</td>
              <td>{{ row.activity }}</td>
              <td>{{ row.factor }}</td>
              <td>{{ row.emission }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="carbon-card">
      <div class="table-head">
        <h3 class="carbon-card-title">核算审计日志</h3>
        <el-button size="small">导出日志</el-button>
      </div>
      <ul class="audit-list">
        <li v-for="log in auditLogs" :key="log.time">
          <span class="audit-time">{{ log.time }}</span>
          <span class="audit-content">{{ log.content }}</span>
        </li>
      </ul>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import {
  accountingSteps,
  scopeSummaries,
  typeDistribution,
  calculationDetails,
  auditLogs
} from '@/data/carbonMock'
</script>

<style scoped>
.steps-row {
  display: flex; align-items: flex-start; gap: 4px; flex-wrap: wrap;
  background: var(--yy-bg-white); border: 1px solid var(--yy-border);
  border-radius: 4px; padding: 16px;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; flex: 1;
  min-width: 100px; position: relative;
}
.step-num {
  width: 32px; height: 32px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; margin-bottom: 8px;
}
.step-label { font-size: 12px; color: var(--yy-text-secondary); }
.step-value { font-size: 13px; font-weight: 600; margin-top: 4px; text-align: center; }
.step-arrow { position: absolute; right: -8px; top: 8px; color: var(--yy-text-placeholder); font-size: 16px; }

.scope-card { padding: 14px 16px; }
.scope-label { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 8px; }
.scope-value { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.scope-detail { font-size: 12px; color: var(--yy-text-placeholder); line-height: 1.5; }

.dist-row {
  display: grid; grid-template-columns: 80px 1fr 120px; gap: 10px;
  align-items: center; margin-bottom: 10px; font-size: 13px;
}
.dist-bar-wrap { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.dist-bar { height: 100%; border-radius: 4px; }
.dist-val { color: var(--yy-text-secondary); font-size: 12px; text-align: right; }

.table-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.table-head .carbon-card-title { margin-bottom: 0; }

.audit-list { list-style: none; margin: 0; padding: 0; }
.audit-list li {
  display: flex; gap: 16px; padding: 10px 0;
  border-bottom: 1px solid var(--yy-border); font-size: 13px;
}
.audit-time { color: var(--yy-text-placeholder); white-space: nowrap; flex-shrink: 0; }
.audit-content { color: var(--yy-text-secondary); }
</style>
