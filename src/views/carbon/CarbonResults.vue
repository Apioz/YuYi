<template>
  <CarbonPageShell page-title="操作日志">
    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">操作日志</span>
          <span class="toolbar-sub">共 {{ displayedLogs.length }} 条</span>
        </div>
        <div class="toolbar-right">
          <el-button size="small">导出日志</el-button>
        </div>
      </div>

      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="日志内容" clearable style="width: 160px" />
        <el-select v-model="filters.module" placeholder="操作模块" clearable style="width: 130px">
          <el-option label="碳核算" value="碳核算" />
          <el-option label="数据采集" value="数据采集" />
          <el-option label="排放因子" value="排放因子" />
          <el-option label="系统" value="系统" />
        </el-select>
        <el-input v-model="filters.operator" placeholder="操作人" clearable style="width: 120px" />
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="applyFilters">搜索</el-button>
        <el-button @click="resetFilters">清空</el-button>
      </div>

      <table class="carbon-table">
        <thead>
          <tr>
            <th style="width: 170px">操作时间</th>
            <th style="width: 110px">操作模块</th>
            <th style="width: 90px">操作人</th>
            <th>日志内容</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedLogs.length === 0">
            <td colspan="4" class="empty-cell">暂无操作日志</td>
          </tr>
          <tr v-for="log in displayedLogs" :key="log.time + log.content">
            <td class="log-time">{{ log.time }}</td>
            <td>{{ log.module }}</td>
            <td>{{ log.operator }}</td>
            <td class="log-content">{{ log.content }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive } from 'vue'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import { auditLogs } from '@/data/carbonMock'

const filters = reactive({
  keyword: '',
  module: '',
  operator: '',
  dateRange: null
})

const applied = reactive({
  keyword: '',
  module: '',
  operator: '',
  dateRange: null
})

function applyFilters() {
  Object.assign(applied, {
    keyword: filters.keyword,
    module: filters.module,
    operator: filters.operator,
    dateRange: filters.dateRange ? [...filters.dateRange] : null
  })
}

function resetFilters() {
  filters.keyword = ''
  filters.module = ''
  filters.operator = ''
  filters.dateRange = null
  applied.keyword = ''
  applied.module = ''
  applied.operator = ''
  applied.dateRange = null
}

const displayedLogs = computed(() =>
  auditLogs.filter((log) => {
    if (applied.keyword.trim() && !log.content.includes(applied.keyword.trim())) return false
    if (applied.module && log.module !== applied.module) return false
    if (applied.operator.trim() && !log.operator.includes(applied.operator.trim())) return false
    if (applied.dateRange?.length === 2) {
      const day = log.time.slice(0, 10)
      if (day < applied.dateRange[0] || day > applied.dateRange[1]) return false
    }
    return true
  })
)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--yy-border);
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; gap: 8px; }
.log-time { color: var(--yy-text-placeholder); white-space: nowrap; }
.log-content { color: var(--yy-text-secondary); }
.empty-cell { text-align: center; color: var(--yy-text-placeholder); padding: 24px !important; }
</style>
