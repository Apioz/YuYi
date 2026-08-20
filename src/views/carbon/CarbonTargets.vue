<template>
  <CarbonPageShell page-title="碳指标管理" show-report-toolbar>
    <div class="flow-tip carbon-mb-12">
      <strong>业务说明：</strong>
      指标清单自动同步<strong>排放源管理</strong>中的全部排放源。指标即活动数据监测阈值，分为<strong>月度指标</strong>与<strong>年度指标</strong>。月度/年度当前值为周期内累计碳值，仅<strong>超过指标上限</strong>时判定为超出阈值（周期内累计值不做超下限提示）。
    </div>

    <div class="stats-grid carbon-mb-12">
      <div v-for="stat in indicatorStats" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ background: `${stat.color}12`, color: stat.color, borderColor: `${stat.color}30` }">
          {{ stat.icon }}
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: stat.color }">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">排放源指标清单</span>
          <span class="toolbar-sub">共 {{ displayedRows.length }} 条 · 自动同步</span>
        </div>
      </div>

      <div class="filter-bar">
        <el-input v-model="filters.sourceName" placeholder="排放源" clearable style="width: 140px" />
        <el-select v-model="filters.scope" placeholder="GHG范围" clearable style="width: 120px">
          <el-option label="Scope 1" value="Scope 1" />
          <el-option label="Scope 2" value="Scope 2" />
          <el-option label="Scope 3" value="Scope 3" />
        </el-select>
        <el-select v-model="filters.collection" placeholder="数据采集" clearable style="width: 120px">
          <el-option v-for="item in collectionOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-date-picker
          v-model="filters.syncTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="同步开始"
          end-placeholder="同步结束"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-input v-model="filters.monthlyThresholdMin" placeholder="月度指标下限" clearable style="width: 120px" />
        <el-input v-model="filters.monthlyThresholdMax" placeholder="月度指标上限" clearable style="width: 120px" />
        <el-select v-model="filters.monthlyThresholdStatus" placeholder="月度状态" clearable style="width: 110px">
          <el-option label="正常" value="正常" />
          <el-option label="超上限" value="超上限" />
          <el-option label="待监测" value="待监测" />
        </el-select>
        <el-input v-model="filters.annualThresholdMin" placeholder="年度指标下限" clearable style="width: 120px" />
        <el-input v-model="filters.annualThresholdMax" placeholder="年度指标上限" clearable style="width: 120px" />
        <el-select v-model="filters.annualThresholdStatus" placeholder="年度状态" clearable style="width: 110px">
          <el-option label="正常" value="正常" />
          <el-option label="超上限" value="超上限" />
          <el-option label="待监测" value="待监测" />
        </el-select>
        <el-button type="primary" @click="applyFilters">搜索</el-button>
        <el-button @click="resetFilters">清空</el-button>
      </div>

      <div class="list-toolbar-row">
        <div class="list-add-bar">
          <el-button type="primary" :disabled="!selectedIds.length" @click="openBatchDialog">批量修改</el-button>
        </div>
      </div>

      <table class="carbon-table">
        <thead>
          <tr>
            <th class="check-col">
              <el-checkbox
                :model-value="isAllDisplayedSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
            <th>排放源</th>
            <th>GHG范围</th>
            <th>数据采集</th>
            <th>同步时间</th>
            <th>月度指标下限</th>
            <th>月度指标上限</th>
            <th>月度当前值</th>
            <th>月度状态</th>
            <th>年度指标下限</th>
            <th>年度指标上限</th>
            <th>年度当前值</th>
            <th>年度状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedRows.length === 0">
            <td colspan="14" class="empty-cell">暂无排放源指标</td>
          </tr>
          <tr v-for="row in displayedRows" :key="row.sourceId" :class="{ 'is-alert': row.isAlert }">
            <td class="check-col">
              <el-checkbox :model-value="selectedIds.includes(row.sourceId)" @change="(val) => toggleRow(row.sourceId, val)" />
            </td>
            <td>{{ row.sourceName }}</td>
            <td>{{ row.scope }}</td>
            <td>{{ row.collection }}</td>
            <td>{{ formatSyncTime(row.lastSyncedAt) }}</td>
            <td>{{ formatIndicatorValue(row.monthlyThresholdMin) }}</td>
            <td>{{ formatIndicatorValue(row.monthlyThresholdMax) }}</td>
            <td>{{ row.monthlyCarbonValue }}</td>
            <td><CarbonThresholdTag v-if="row.monthlyThresholdStatus !== '待监测'" :status="row.monthlyThresholdStatus" /><span v-else class="text-muted">待监测</span></td>
            <td>{{ formatIndicatorValue(row.annualThresholdMin) }}</td>
            <td>{{ formatIndicatorValue(row.annualThresholdMax) }}</td>
            <td>{{ row.annualCarbonValue }}</td>
            <td><CarbonThresholdTag v-if="row.annualThresholdStatus !== '待监测'" :status="row.annualThresholdStatus" /><span v-else class="text-muted">待监测</span></td>
            <td class="action-cell"><span class="carbon-link" @click="openEditDialog(row)">编辑</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 单条编辑 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑指标 — ${editForm.sourceName}`"
      width="560px"
      align-center
      class="yy-dialog"
      destroy-on-close
    >
      <el-form label-position="top">
        <div class="form-section-title">月度指标 (tCO₂e)</div>
        <div class="form-row">
          <el-form-item label="指标下限">
            <el-input v-model="editForm.monthlyThresholdMin" placeholder="下限" />
          </el-form-item>
          <el-form-item label="指标上限">
            <el-input v-model="editForm.monthlyThresholdMax" placeholder="上限" />
          </el-form-item>
        </div>
        <div class="form-section-title">年度指标 (tCO₂e)</div>
        <div class="form-row">
          <el-form-item label="指标下限">
            <el-input v-model="editForm.annualThresholdMin" placeholder="下限" />
          </el-form-item>
          <el-form-item label="指标上限">
            <el-input v-model="editForm.annualThresholdMax" placeholder="上限" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量修改指标"
      width="560px"
      align-center
      class="yy-dialog"
      destroy-on-close
    >
      <div class="import-tip carbon-mb-12">已选 {{ selectedIds.length }} 个排放源。留空字段不会修改。</div>
      <el-form label-position="top">
        <div class="form-section-title">月度指标 (tCO₂e)</div>
        <div class="form-row">
          <el-form-item label="指标下限">
            <el-input v-model="batchForm.monthlyThresholdMin" placeholder="留空不修改" />
          </el-form-item>
          <el-form-item label="指标上限">
            <el-input v-model="batchForm.monthlyThresholdMax" placeholder="留空不修改" />
          </el-form-item>
        </div>
        <div class="form-section-title">年度指标 (tCO₂e)</div>
        <div class="form-row">
          <el-form-item label="指标下限">
            <el-input v-model="batchForm.annualThresholdMin" placeholder="留空不修改" />
          </el-form-item>
          <el-form-item label="指标上限">
            <el-input v-model="batchForm.annualThresholdMax" placeholder="留空不修改" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">应用</el-button>
      </template>
    </el-dialog>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'
import { collectionFrequencyMap } from '@/data/carbonMock'

const collectionOptions = Object.keys(collectionFrequencyMap)

const { indicatorManagementRows, saveActivityThresholdRules } = useCarbonBusiness()

const filters = reactive({
  sourceName: '',
  scope: '',
  collection: '',
  syncTimeRange: null,
  monthlyThresholdMin: '',
  monthlyThresholdMax: '',
  monthlyThresholdStatus: '',
  annualThresholdMin: '',
  annualThresholdMax: '',
  annualThresholdStatus: ''
})

const applied = reactive({
  sourceName: '',
  scope: '',
  collection: '',
  syncTimeRange: null,
  monthlyThresholdMin: '',
  monthlyThresholdMax: '',
  monthlyThresholdStatus: '',
  annualThresholdMin: '',
  annualThresholdMax: '',
  annualThresholdStatus: ''
})

const selectedIds = ref([])
const editDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const editForm = ref(createEmptyEditForm())
const batchForm = reactive({
  monthlyThresholdMin: '',
  monthlyThresholdMax: '',
  annualThresholdMin: '',
  annualThresholdMax: ''
})

function createEmptyEditForm() {
  return {
    sourceId: '',
    sourceName: '',
    monthlyThresholdMin: '',
    monthlyThresholdMax: '',
    annualThresholdMin: '',
    annualThresholdMax: ''
  }
}

function parseFilterNumber(value) {
  if (value == null || String(value).trim() === '') return null
  const num = Number(String(value).trim().replace(/,/g, ''))
  return Number.isNaN(num) ? null : num
}

function matchNumericFilter(filterText, rowNumeric, rowDisplay) {
  if (!filterText.trim()) return true
  const filterNum = parseFilterNumber(filterText)
  if (filterNum != null) {
    if (rowNumeric != null) return rowNumeric === filterNum
    const displayNum = parseFilterNumber(rowDisplay)
    return displayNum != null && displayNum === filterNum
  }
  return String(rowDisplay ?? '—').includes(filterText.trim())
}

const displayedRows = computed(() =>
  indicatorManagementRows.value.filter((row) => {
    if (applied.sourceName.trim() && !row.sourceName.includes(applied.sourceName.trim())) return false
    if (applied.scope && row.scope !== applied.scope) return false
    if (applied.collection && row.collection !== applied.collection) return false
    if (applied.syncTimeRange?.length === 2) {
      if (!row.lastSyncedAt) return false
      const day = row.lastSyncedAt.slice(0, 10)
      if (day < applied.syncTimeRange[0] || day > applied.syncTimeRange[1]) return false
    }
    if (!matchNumericFilter(applied.monthlyThresholdMin, row.monthlyThresholdMin, formatIndicatorValue(row.monthlyThresholdMin))) return false
    if (!matchNumericFilter(applied.monthlyThresholdMax, row.monthlyThresholdMax, formatIndicatorValue(row.monthlyThresholdMax))) return false
    if (applied.monthlyThresholdStatus && row.monthlyThresholdStatus !== applied.monthlyThresholdStatus) return false
    if (!matchNumericFilter(applied.annualThresholdMin, row.annualThresholdMin, formatIndicatorValue(row.annualThresholdMin))) return false
    if (!matchNumericFilter(applied.annualThresholdMax, row.annualThresholdMax, formatIndicatorValue(row.annualThresholdMax))) return false
    if (applied.annualThresholdStatus && row.annualThresholdStatus !== applied.annualThresholdStatus) return false
    return true
  })
)

const indicatorStats = computed(() => {
  const rows = indicatorManagementRows.value
  return [
    { icon: 'Σ', label: '排放源指标', count: rows.length, color: '#4a9eff' },
    { icon: '✓', label: '已配置指标', count: rows.filter((r) => r.isConfigured).length, color: '#1dbf73' },
    { icon: 'M', label: '月度超限', count: rows.filter((r) => r.monthlyThresholdStatus !== '正常' && r.monthlyThresholdStatus !== '待监测').length, color: '#f5a623' },
    { icon: '!', label: '年度超限', count: rows.filter((r) => r.annualThresholdStatus !== '正常' && r.annualThresholdStatus !== '待监测').length, color: '#ff4d4f' }
  ]
})

const isAllDisplayedSelected = computed(() =>
  displayedRows.value.length > 0 && displayedRows.value.every((row) => selectedIds.value.includes(row.sourceId))
)

const isIndeterminate = computed(() => {
  const count = displayedRows.value.filter((row) => selectedIds.value.includes(row.sourceId)).length
  return count > 0 && count < displayedRows.value.length
})

function formatIndicatorValue(value) {
  return value == null || value === '' ? '—' : value.toLocaleString()
}

function formatSyncTime(value) {
  return value ? value : '—'
}

function applyFilters() {
  Object.assign(applied, {
    ...filters,
    syncTimeRange: filters.syncTimeRange ? [...filters.syncTimeRange] : null
  })
}

function resetFilters() {
  filters.sourceName = ''
  filters.scope = ''
  filters.collection = ''
  filters.syncTimeRange = null
  filters.monthlyThresholdMin = ''
  filters.monthlyThresholdMax = ''
  filters.monthlyThresholdStatus = ''
  filters.annualThresholdMin = ''
  filters.annualThresholdMax = ''
  filters.annualThresholdStatus = ''
  applied.sourceName = ''
  applied.scope = ''
  applied.collection = ''
  applied.syncTimeRange = null
  applied.monthlyThresholdMin = ''
  applied.monthlyThresholdMax = ''
  applied.monthlyThresholdStatus = ''
  applied.annualThresholdMin = ''
  applied.annualThresholdMax = ''
  applied.annualThresholdStatus = ''
}

function toggleRow(sourceId, checked) {
  if (checked) {
    if (!selectedIds.value.includes(sourceId)) selectedIds.value.push(sourceId)
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== sourceId)
  }
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = displayedRows.value.map((row) => row.sourceId)
  } else {
    selectedIds.value = []
  }
}

function openEditDialog(row) {
  editForm.value = {
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    monthlyThresholdMin: row.monthlyThresholdMin ?? '',
    monthlyThresholdMax: row.monthlyThresholdMax ?? '',
    annualThresholdMin: row.annualThresholdMin ?? '',
    annualThresholdMax: row.annualThresholdMax ?? ''
  }
  editDialogVisible.value = true
}

function openBatchDialog() {
  batchForm.monthlyThresholdMin = ''
  batchForm.monthlyThresholdMax = ''
  batchForm.annualThresholdMin = ''
  batchForm.annualThresholdMax = ''
  batchDialogVisible.value = true
}

function validateThresholdRow(row, label) {
  const monthlyMin = row.monthlyThresholdMin === '' || row.monthlyThresholdMin == null ? null : Number(row.monthlyThresholdMin)
  const monthlyMax = row.monthlyThresholdMax === '' || row.monthlyThresholdMax == null ? null : Number(row.monthlyThresholdMax)
  const annualMin = row.annualThresholdMin === '' || row.annualThresholdMin == null ? null : Number(row.annualThresholdMin)
  const annualMax = row.annualThresholdMax === '' || row.annualThresholdMax == null ? null : Number(row.annualThresholdMax)
  if ([monthlyMin, monthlyMax, annualMin, annualMax].some((n) => n != null && Number.isNaN(n))) {
    ElMessage.warning(`${label}存在无效数值`)
    return false
  }
  if (monthlyMin != null && monthlyMax != null && monthlyMin > monthlyMax) {
    ElMessage.warning(`${label}月度指标下限不能大于上限`)
    return false
  }
  if (annualMin != null && annualMax != null && annualMin > annualMax) {
    ElMessage.warning(`${label}年度指标下限不能大于上限`)
    return false
  }
  return true
}

function submitEdit() {
  if (!validateThresholdRow(editForm.value, `排放源「${editForm.value.sourceName}」`)) return
  saveActivityThresholdRules([editForm.value])
  editDialogVisible.value = false
  ElMessage.success('指标已保存')
}

function submitBatch() {
  const hasAny = Object.values(batchForm).some((v) => v !== '' && v != null)
  if (!hasAny) {
    ElMessage.warning('请至少填写一项要批量修改的指标')
    return
  }

  const updates = selectedIds.value.map((sourceId) => {
    const current = indicatorManagementRows.value.find((row) => row.sourceId === sourceId)
    return {
      sourceId,
      sourceName: current?.sourceName ?? sourceId,
      monthlyThresholdMin: batchForm.monthlyThresholdMin !== '' ? batchForm.monthlyThresholdMin : (current?.monthlyThresholdMin ?? ''),
      monthlyThresholdMax: batchForm.monthlyThresholdMax !== '' ? batchForm.monthlyThresholdMax : (current?.monthlyThresholdMax ?? ''),
      annualThresholdMin: batchForm.annualThresholdMin !== '' ? batchForm.annualThresholdMin : (current?.annualThresholdMin ?? ''),
      annualThresholdMax: batchForm.annualThresholdMax !== '' ? batchForm.annualThresholdMax : (current?.annualThresholdMax ?? '')
    }
  })

  for (const row of updates) {
    if (!validateThresholdRow(row, `排放源「${row.sourceName}」`)) return
  }

  saveActivityThresholdRules(updates)
  batchDialogVisible.value = false
  ElMessage.success(`已批量更新 ${updates.length} 个排放源指标`)
}
</script>

<style scoped>
.flow-tip {
  font-size: 12px;
  color: var(--yy-text-secondary);
  line-height: 1.55;
  padding: 10px 14px;
  background: #fafbfc;
  border: 1px solid var(--yy-border);
  border-left: 3px solid var(--yy-primary);
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--yy-bg-white);
  border: 1px solid var(--yy-border);
  border-radius: 4px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}

.stat-count { font-size: 20px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12px; color: var(--yy-text-secondary); margin-top: 2px; }

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

.list-toolbar-row { margin-bottom: 10px; }
.check-col { width: 42px; text-align: center; }
.group-head { text-align: center; background: #f6f8fa; }
.action-cell { white-space: nowrap; }
.text-muted { color: var(--yy-text-placeholder); font-size: 12px; }
.empty-cell { text-align: center; color: var(--yy-text-placeholder); padding: 24px !important; }
tr.is-alert td { background: #fff7f7; }

.form-section-title {
  font-size: 13px;
  font-weight: 600;
  margin: 4px 0 8px;
  color: var(--yy-text-primary);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.import-tip { font-size: 13px; color: var(--yy-text-secondary); }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
