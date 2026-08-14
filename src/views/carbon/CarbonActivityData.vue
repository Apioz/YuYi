<template>
  <CarbonPageShell page-title="活动数据采集">
    <div class="stats-grid">
      <div v-for="stat in activityStats" :key="stat.label" class="stat-card">
        <div
          class="stat-icon"
          :style="{ background: `${stat.color}12`, color: stat.color, borderColor: `${stat.color}30` }"
        >
          {{ stat.icon }}
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: stat.color }">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="flow-tip carbon-mb-12">
      <strong>业务说明：</strong>
      排放源在<strong>排放源管理</strong>中维护，其<strong>能值</strong>由接口同步至排放源自身数据。本页「<strong>采集录入</strong>」用于选择排放源并引用接口能值生成监测记录；<strong>手动录入</strong>类型也可通过「导入数据记录」按周期维护。
      列表展示各排放源<strong>最新一条</strong>记录，点击「数据记录」可<strong>追溯历史</strong>。阈值在「阈值设置」中统一配置。
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">监控数据明细</span>
          <span class="toolbar-sub">共 {{ displayedRows.length }} 条</span>
        </div>
      </div>

      <div class="filter-bar">
        <el-input v-model="filters.source" placeholder="排放源" clearable style="width: 160px" />
        <el-select v-model="filters.collection" placeholder="数据采集" clearable style="width: 130px">
          <el-option label="自动采集" value="自动采集" />
          <el-option label="系统对接" value="系统对接" />
          <el-option label="手动录入" value="手动录入" />
        </el-select>
        <el-select v-model="filters.thresholdStatus" placeholder="监控状态" clearable style="width: 130px">
          <el-option label="正常" value="正常" />
          <el-option label="超上限" value="超上限" />
          <el-option label="超下限" value="超下限" />
        </el-select>
        <el-button type="primary" @click="applyFilters">搜索</el-button>
        <el-button @click="resetFilters">清空</el-button>
      </div>

      <div class="list-toolbar-row">
        <div class="list-add-bar">
          <el-button type="primary" @click="openCollectDialog">+ 采集录入</el-button>
        </div>
        <div class="list-io-bar">
          <el-button @click="openThresholdSettings">阈值设置</el-button>
          <el-button @click="openImport">导入数据记录</el-button>
        </div>
      </div>

      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源</th>
            <th>数据采集</th>
            <th>采集频率</th>
            <th>最新记录周期</th>
            <th>能值</th>
            <th>计算公式</th>
            <th>碳值 (tCO₂e)</th>
            <th>阈值范围</th>
            <th>监控状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedRows.length === 0">
            <td colspan="11" class="empty-cell">暂无活动数据</td>
          </tr>
          <tr v-for="row in displayedRows" :key="row.sourceId" :class="{ 'is-alert': row.isAlert }">
            <td>{{ row.source }}</td>
            <td><CarbonQualityTag :label="row.collection" /></td>
            <td class="freq-cell">{{ row.collectionFrequency }}</td>
            <td>{{ row.hasData ? row.recordPeriod : '—' }}</td>
            <td>{{ row.hasData ? `${row.energyValue} ${row.unit}` : '—' }}</td>
            <td class="formula-cell">{{ row.hasData ? row.calcFormula : '—' }}</td>
            <td :class="{ 'value-alert': row.isAlert }">{{ row.hasData ? row.carbonValue : '—' }}</td>
            <td class="readonly-cell">{{ formatThresholdRange({ thresholdMin: row.thresholdMin, thresholdMax: row.thresholdMax }) }}</td>
            <td>
              <CarbonThresholdTag v-if="row.hasData" :status="row.thresholdStatus" />
              <span v-else class="text-muted">待数据</span>
            </td>
            <td>{{ row.hasData ? row.updated : row.monitoredAt }}</td>
            <td class="action-cell">
              <span class="carbon-link" @click="openHistory(row)">数据记录</span>
              <span class="carbon-link carbon-link--danger" @click="handleDelete(row)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 阈值设置 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="活动数据阈值设置"
      width="720px"
      align-center
      class="yy-dialog"
      destroy-on-close
    >
      <div class="import-tip">按排放源统一配置核算碳值 (tCO₂e) 监控阈值。</div>
      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源</th>
            <th>GHG范围</th>
            <th>阈值下限 (tCO₂e)</th>
            <th>阈值上限 (tCO₂e)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in thresholdFormRows" :key="row.sourceId">
            <td>{{ row.sourceName }}</td>
            <td>{{ row.scope }}</td>
            <td><el-input v-model="row.thresholdMin" placeholder="下限" size="small" /></td>
            <td><el-input v-model="row.thresholdMax" placeholder="上限" size="small" /></td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <el-button @click="thresholdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveThresholdSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 采集录入 -->
    <el-dialog
      v-model="collectDialogVisible"
      title="采集录入"
      width="760px"
      align-center
      class="yy-dialog"
      destroy-on-close
      @closed="resetCollectForm"
    >
      <div class="import-tip carbon-mb-12">
        选择排放源管理中<strong>已启用</strong>的排放源，系统将自动引用该排放源<strong>接口同步的能值</strong>（不可手填），并预估碳值。
      </div>
      <el-form label-position="top">
        <el-form-item label="选择排放源" required>
          <el-select
            v-model="selectedCollectIds"
            multiple
            filterable
            collapse-tags
            style="width: 100%"
            placeholder="选择要采集的排放源"
          >
            <el-option
              v-for="s in collectableEmissionSources"
              :key="s.id"
              :label="`${s.name}（${s.energyValue ?? '—'} ${s.activityUnit ?? ''}）`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <div v-if="!collectableEmissionSources.length" class="empty-hint">暂无可选排放源，请先在排放源管理中配置并启用。</div>
        <div v-if="collectPreview.length" class="collect-preview">
          <div class="preview-title">采集预览</div>
          <table class="carbon-table">
            <thead>
              <tr>
                <th>排放源</th>
                <th>数据采集</th>
                <th>接口能值</th>
                <th>同步时间</th>
                <th>预估碳值 (tCO₂e)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in collectPreview" :key="row.id">
                <td>{{ row.name }}</td>
                <td><CarbonQualityTag :label="row.collection" /></td>
                <td>{{ row.energyDisplay }}</td>
                <td>{{ row.syncedAt }}</td>
                <td>{{ row.carbonPreview }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="collectDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedCollectIds.length" @click="submitCollect">确认采集</el-button>
      </template>
    </el-dialog>

    <!-- 历史数据记录（仪表数据样式） -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`${historySource?.source ?? ''} — 数据记录`"
      width="980px"
      align-center
      destroy-on-close
      class="yy-dialog yy-dialog--flush activity-record-dialog"
      @opened="handleHistoryDialogOpened"
    >
      <CarbonActivityRecordPanel
        v-if="historySource"
        :source="historySource"
        :records="historyRecords"
      />
    </el-dialog>

    <!-- 导入数据记录（手工导入类型） -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入数据记录"
      width="720px"
      align-center
      class="yy-dialog"
      destroy-on-close
      @closed="resetImport"
    >
      <div class="import-tip">
        适用于<strong>数据采集 = 手动录入</strong>且已设置监控的排放源。记录周期示例：2024-12（月）或 2024-12-31（日）。
        <span class="carbon-link" @click="downloadTemplate">下载导入模板</span>
      </div>
      <el-upload drag accept=".csv" :auto-upload="false" :show-file-list="false" :on-change="handleImportFile">
        <div class="upload-inner">
          <p>将 CSV 文件拖到此处，或点击上传</p>
          <p class="upload-sub">必填列：排放源、记录周期、能值</p>
        </div>
      </el-upload>
      <div v-if="importPreview.length" class="import-preview">
        <div class="preview-title">预览（{{ importPreview.length }} 条）</div>
        <table class="carbon-table">
          <thead>
            <tr>
              <th>排放源</th>
              <th>记录周期</th>
              <th>能值</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in importPreview" :key="idx">
              <td>{{ row.sourceName }}</td>
              <td>{{ row.recordPeriod }}</td>
              <td>{{ row.energyValue }}</td>
              <td>{{ row.unit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="importErrors.length" class="import-errors">
        <div v-for="(err, idx) in importErrors" :key="idx" class="import-error">{{ err }}</div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importPreview.length" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'
import CarbonActivityRecordPanel from '@/components/carbon/CarbonActivityRecordPanel.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'
import { calculateCarbonEmission } from '@/composables/useCarbonCalculation'
import {
  createRecordId,
  parseRecordCsv,
  downloadRecordTemplate
} from '@/composables/useActivityData'

const {
  activityDataWithThreshold,
  activityStats,
  collectableEmissionSources,
  getEmissionSourceById,
  getFactorById,
  getEnrichedRecordsBySourceId,
  isSourceMonitored,
  resolveSourceByName,
  collectActivityFromSources,
  deleteMonitoredActivity,
  addActivityRecordsBatch,
  saveActivityThresholdRules,
  thresholdSettingsRows,
  formatThresholdRange
} = useCarbonBusiness()

const filters = reactive({
  source: '',
  collection: '',
  thresholdStatus: ''
})

const applied = reactive({
  source: '',
  collection: '',
  thresholdStatus: ''
})

const collectDialogVisible = ref(false)
const selectedCollectIds = ref([])
const thresholdDialogVisible = ref(false)
const thresholdFormRows = ref([])
const historyDialogVisible = ref(false)
const historySource = ref(null)
const historyRecords = ref([])
const importDialogVisible = ref(false)
const importPreview = ref([])
const importErrors = ref([])

const collectPreview = computed(() =>
  selectedCollectIds.value
    .map((id) => {
      const source = getEmissionSourceById(id)
      if (!source) return null
      const factor = getFactorById(source.factorId)
      const { carbonNumeric } = calculateCarbonEmission(source.numericEnergyValue, factor, source)
      return {
        id,
        name: source.name,
        collection: source.collection,
        energyDisplay:
          source.numericEnergyValue != null
            ? `${source.energyValue ?? source.numericEnergyValue} ${source.activityUnit ?? ''}`
            : '—',
        syncedAt: source.energySyncedAt ?? '—',
        carbonPreview: Number.isNaN(carbonNumeric) ? '—' : carbonNumeric.toFixed(2)
      }
    })
    .filter(Boolean)
)

const displayedRows = computed(() =>
  activityDataWithThreshold.value.filter((row) => {
    if (applied.source.trim() && !row.source.includes(applied.source.trim())) return false
    if (applied.collection && row.collection !== applied.collection) return false
    if (applied.thresholdStatus && row.thresholdStatus !== applied.thresholdStatus) return false
    return true
  })
)

function applyFilters() {
  Object.assign(applied, { ...filters })
}

function resetFilters() {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  Object.keys(applied).forEach((key) => {
    applied[key] = ''
  })
}

function openCollectDialog() {
  selectedCollectIds.value = []
  collectDialogVisible.value = true
}

function resetCollectForm() {
  selectedCollectIds.value = []
}

function submitCollect() {
  if (!selectedCollectIds.value.length) {
    ElMessage.warning('请选择排放源')
    return
  }
  const missing = selectedCollectIds.value.filter((id) => {
    const source = getEmissionSourceById(id)
    return !source || source.numericEnergyValue == null
  })
  if (missing.length) {
    ElMessage.warning('部分排放源暂无接口能值，无法采集')
    return
  }
  const count = collectActivityFromSources(selectedCollectIds.value)
  collectDialogVisible.value = false
  ElMessage.success(`已采集 ${count} 条活动数据`)
}

function openThresholdSettings() {
  thresholdFormRows.value = thresholdSettingsRows.value.map((row) => ({
    ...row,
    thresholdMin: row.thresholdMin ?? '',
    thresholdMax: row.thresholdMax ?? ''
  }))
  thresholdDialogVisible.value = true
}

function saveThresholdSettings() {
  for (const row of thresholdFormRows.value) {
    const min = row.thresholdMin === '' || row.thresholdMin == null ? null : Number(row.thresholdMin)
    const max = row.thresholdMax === '' || row.thresholdMax == null ? null : Number(row.thresholdMax)
    if (min != null && max != null && min > max) {
      ElMessage.warning(`排放源「${row.sourceName}」的阈值下限不能大于上限`)
      return
    }
  }
  saveActivityThresholdRules(thresholdFormRows.value)
  thresholdDialogVisible.value = false
  ElMessage.success('阈值设置已保存')
}

function openHistory(row) {
  historySource.value = row
  historyRecords.value = getEnrichedRecordsBySourceId(row.sourceId)
  historyDialogVisible.value = true
}

function handleHistoryDialogOpened() {
  window.dispatchEvent(new Event('resize'))
}

async function handleDelete(row) {
  const msg = row.recordCount
    ? `确定删除「${row.source}」？监控配置及 ${row.recordCount} 条历史记录将被清除，不可恢复。`
    : `确定删除「${row.source}」的监控配置？`
  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    deleteMonitoredActivity(row.sourceId)
    ElMessage.success('已删除')
  } catch {
    /* cancelled */
  }
}

function openImport() {
  resetImport()
  importDialogVisible.value = true
}

function resetImport() {
  importPreview.value = []
  importErrors.value = []
}

function downloadTemplate() {
  downloadRecordTemplate()
}

function handleImportFile(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const { rows, errors } = parseRecordCsv(e.target.result, resolveSourceByName, isSourceMonitored)
    importPreview.value = rows
    importErrors.value = errors
    if (!rows.length && errors.length) {
      ElMessage.error('导入文件解析失败')
    } else if (rows.length) {
      ElMessage.success(`已解析 ${rows.length} 条数据记录`)
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function confirmImport() {
  if (!importPreview.value.length) return
  const records = importPreview.value.map((row) => ({
    id: createRecordId(),
    sourceId: row.sourceId,
    recordPeriod: row.recordPeriod,
    energyValue: row.energyValue,
    numericValue: row.numericValue,
    unit: row.unit,
    recordSource: row.recordSource,
    recordedAt: row.recordedAt
  }))
  addActivityRecordsBatch(records)
  importDialogVisible.value = false
  ElMessage.success(`成功导入 ${records.length} 条数据记录`)
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
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

.stat-body {
  min-width: 0;
}

.stat-count {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--yy-text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--yy-border);
}

.toolbar-left { display: flex; align-items: baseline; gap: 8px; }
.toolbar-title { font-size: 14px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.formula-cell { font-size: 12px; color: var(--yy-text-secondary); max-width: 200px; }
.freq-cell { font-size: 12px; color: var(--yy-text-secondary); }
.readonly-cell { color: var(--yy-text-secondary); }
.action-cell { white-space: nowrap; }
.text-muted { color: var(--yy-text-placeholder); font-size: 12px; }
.carbon-link--danger { color: #ff4d4f; }
.carbon-link--danger:hover { color: #ff7875; }
.empty-cell { text-align: center; color: var(--yy-text-placeholder); padding: 24px !important; }
.empty-hint { font-size: 13px; color: var(--yy-text-placeholder); }
tr.is-alert td { background: #fff7f7; }
.value-alert { color: #ff4d4f; font-weight: 600; }
.import-tip { margin-bottom: 12px; font-size: 13px; color: var(--yy-text-secondary); }
.upload-inner { padding: 12px 0; color: var(--yy-text-secondary); }
.upload-sub { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 4px; }
.import-preview { margin-top: 16px; }
.collect-preview { margin-top: 12px; }
.preview-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.import-errors { margin-top: 12px; }
.import-error { color: #ff4d4f; font-size: 13px; line-height: 1.6; }

.list-toolbar-row { margin-bottom: 10px; }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
}


</style>
