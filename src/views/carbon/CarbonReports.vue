<template>
  <CarbonPageShell page-title="碳报告中心" show-report-toolbar>
    <div class="carbon-card carbon-mb-12">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">报告列表</span>
          <span class="toolbar-sub">共 {{ displayedReports.length }} 份报告</span>
        </div>
      </div>
      <div class="filter-bar">
        <el-input v-model="filters.name" placeholder="报告名称" clearable style="width: 180px" />
        <el-select v-model="filters.type" placeholder="报告类型" clearable style="width: 140px">
          <el-option label="年度核算报告" value="年度核算报告" />
          <el-option label="月度摘要" value="月度摘要" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 110px">
          <el-option label="已发布" value="已发布" />
          <el-option label="草稿" value="草稿" />
        </el-select>
        <el-button type="primary" @click="applyFilters">搜索</el-button>
        <el-button @click="resetFilters">清空</el-button>
        <el-button type="primary">生成报告</el-button>
      </div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>报告名称</th>
            <th>报告类型</th>
            <th>核算周期</th>
            <th>总排放量</th>
            <th>生成时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayedReports" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.type }}</td>
            <td>{{ row.period }}</td>
            <td>{{ row.emission }}</td>
            <td>{{ row.created }}</td>
            <td>
              <el-tag :type="row.status === '已发布' ? 'success' : 'info'" size="small" effect="light">
                {{ row.status }}
              </el-tag>
            </td>
            <td>
              <span class="carbon-link">预览</span>
              <span class="carbon-link">下载</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="carbon-card">
      <h3 class="carbon-card-title">报告模板</h3>
      <div class="template-grid">
        <div v-for="tpl in templates" :key="tpl.name" class="template-item">
          <div class="template-name">{{ tpl.name }}</div>
          <div class="template-desc">{{ tpl.desc }}</div>
          <el-button size="small" type="primary" plain>使用模板</el-button>
        </div>
      </div>
    </div>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive } from 'vue'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'

const filters = reactive({ name: '', type: '', status: '' })
const applied = reactive({ name: '', type: '', status: '' })

const reports = [
  { name: '2024年度碳排放核算报告', type: '年度核算报告', period: '2024年度', emission: '19,605 tCO₂e', created: '2024-12-31 23:59', status: '已发布' },
  { name: '2024年12月碳排放摘要', type: '月度摘要', period: '2024-12', emission: '1,795 tCO₂e', created: '2024-12-31 18:00', status: '已发布' },
  { name: '2024年11月碳排放摘要', type: '月度摘要', period: '2024-11', emission: '1,810 tCO₂e', created: '2024-11-30 18:00', status: '已发布' },
  { name: '2024年度核查报告（草稿）', type: '年度核算报告', period: '2024年度', emission: '19,605 tCO₂e', created: '2024-12-28 10:00', status: '草稿' }
]

function applyFilters() {
  Object.assign(applied, { ...filters })
}

function resetFilters() {
  Object.keys(filters).forEach((key) => { filters[key] = '' })
  Object.keys(applied).forEach((key) => { applied[key] = '' })
}

const displayedReports = computed(() =>
  reports.filter((row) => {
    if (applied.name.trim() && !row.name.includes(applied.name.trim())) return false
    if (applied.type && row.type !== applied.type) return false
    if (applied.status && row.status !== applied.status) return false
    return true
  })
)

const templates = [
  { name: 'GB/T 32150 核算报告', desc: '国家标准格式年度温室气体排放报告' },
  { name: 'Scope 1/2/3 分项报告', desc: '按 GHG 范围分项汇总' },
  { name: '月度监测摘要', desc: '月度排放数据摘要报告' }
]
</script>

<style scoped>
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; gap: 8px; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.template-item {
  border: 1px solid var(--yy-border); border-radius: 4px; padding: 16px; background: #fafafa;
}
.template-name { font-weight: 600; margin-bottom: 6px; }
.template-desc { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 12px; min-height: 36px; }
@media (max-width: 900px) { .template-grid { grid-template-columns: 1fr; } }
</style>
