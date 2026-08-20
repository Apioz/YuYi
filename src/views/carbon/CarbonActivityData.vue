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
      排放源在<strong>排放源管理</strong>中维护。<strong>自动采集 / 系统对接</strong>类型能值由接口同步；<strong>手动录入</strong>类型在「采集录入」中填写最新记录周期与能值，也可通过「导入数据记录」批量维护。
      列表展示监测结果。月度/年度<strong>指标</strong>请在<strong>碳指标管理</strong>中配置。月度/年度当前值为周期内累计碳值，仅<strong>超过指标上限</strong>时判定为超出阈值。
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
        </el-select>
        <el-button type="primary" @click="applyFilters">搜索</el-button>
        <el-button @click="resetFilters">清空</el-button>
      </div>

      <div class="list-toolbar-row">
        <div class="list-add-bar">
          <el-button type="primary" @click="openCollectDialog">+ 采集录入</el-button>
        </div>
        <div class="list-io-bar">
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
            <th>月度碳值</th>
            <th>月度阈值</th>
            <th>月度状态</th>
            <th>年度碳值</th>
            <th>年度阈值</th>
            <th>年度状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedRows.length === 0">
            <td colspan="15" class="empty-cell">暂无活动数据</td>
          </tr>
          <tr v-for="row in displayedRows" :key="row.sourceId" :class="{ 'is-alert': row.isAlert }">
            <td>{{ row.source }}</td>
            <td><CarbonQualityTag :label="row.collection" /></td>
            <td class="freq-cell">{{ row.collectionFrequency }}</td>
            <td>{{ row.hasData ? row.recordPeriod : '—' }}</td>
            <td>{{ row.hasData ? `${row.energyValue} ${row.unit}` : '—' }}</td>
            <td class="formula-cell">{{ row.hasData ? row.calcFormula : '—' }}</td>
            <td :class="{ 'value-alert': row.isAlert }">{{ row.hasData ? row.carbonValue : '—' }}</td>
            <td>{{ row.hasData ? row.monthlyCarbonValue : '—' }}</td>
            <td class="readonly-cell">{{ formatThresholdRange(row, 'monthly') }}</td>
            <td>
              <CarbonThresholdTag v-if="row.hasData" :status="row.monthlyThresholdStatus" />
              <span v-else class="text-muted">待数据</span>
            </td>
            <td>{{ row.hasData ? row.annualCarbonValue : '—' }}</td>
            <td class="readonly-cell">{{ formatThresholdRange(row, 'annual') }}</td>
            <td>
              <CarbonThresholdTag v-if="row.hasData" :status="row.annualThresholdStatus" />
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
        选择排放源管理中<strong>已启用</strong>的排放源。<strong>自动采集 / 系统对接</strong>类型将引用接口同步能值；<strong>手动录入</strong>类型需填写最新记录周期与能值。
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
            @change="syncCollectEntries"
          >
            <el-option
              v-for="s in collectableEmissionSources"
              :key="s.id"
              :label="`${s.name}（${s.collection}${s.collection === '手动录入' ? '' : ` · ${s.energyValue ?? '—'} ${s.activityUnit ?? ''}`}）`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <div v-if="!collectableEmissionSources.length" class="empty-hint">暂无可选排放源，请先在排放源管理中配置并启用。</div>
        <div v-for="sourceId in manualCollectIds" :key="sourceId" class="manual-entry-block">
          <div class="manual-entry-title">{{ getSourceLabel(sourceId) }} · 手动录入</div>
          <div class="form-row">
            <el-form-item label="最新记录周期" required>
              <el-input v-model="collectEntries[sourceId].recordPeriod" placeholder="如：2024-12 或 2024-12-31" />
            </el-form-item>
            <el-form-item label="能值" required>
              <el-input v-model="collectEntries[sourceId].energyValue" placeholder="监测数值">
                <template #append>{{ collectEntries[sourceId].unit }}</template>
              </el-input>
            </el-form-item>
          </div>
        </div>
        <div v-if="collectPreview.length" class="collect-preview">
          <div class="preview-title">采集预览</div>
          <table class="carbon-table">
            <thead>
              <tr>
                <th>排放源</th>
                <th>数据采集</th>
                <th>记录周期</th>
                <th>能值</th>
                <th>同步时间</th>
                <th>预估碳值 (tCO₂e)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in collectPreview" :key="row.id">
                <td>{{ row.name }}</td>
                <td><CarbonQualityTag :label="row.collection" /></td>
                <td>{{ row.recordPeriod }}</td>
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
  downloadRecordTemplate,
  formatEnergyValue,
  parseActivityNumeric
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
const collectEntries = ref({})
const historyDialogVisible = ref(false)
const historySource = ref(null)
const historyRecords = ref([])
const importDialogVisible = ref(false)
const importPreview = ref([])
const importErrors = ref([])

const manualCollectIds = computed(() =>
  selectedCollectIds.value.filter((id) => getEmissionSourceById(id)?.collection === '手动录入')
)

const collectPreview = computed(() =>
  selectedCollectIds.value
    .map((id) => {
      const source = getEmissionSourceById(id)
      if (!source) return null
      const isManual = source.collection === '手动录入'
      const entry = collectEntries.value[id]
      let numericValue = source.numericEnergyValue
      if (isManual) {
        numericValue = parseActivityNumeric(entry?.energyValue)
      }
      const factor = getFactorById(source.factorId)
      const { carbonNumeric } = calculateCarbonEmission(numericValue, factor, source)
      return {
        id,
        name: source.name,
        collection: source.collection,
        recordPeriod: isManual
          ? (entry?.recordPeriod?.trim() || '待填写')
          : resolveRecordPeriod(source, source.energySyncedAt),
        energyDisplay: isManual
          ? (numericValue != null ? `${formatEnergyValue(numericValue)} ${entry?.unit ?? source.activityUnit ?? ''}` : '待填写')
          : (source.numericEnergyValue != null
            ? `${source.energyValue ?? source.numericEnergyValue} ${source.activityUnit ?? ''}`
            : '—'),
        syncedAt: isManual ? '—' : (source.energySyncedAt ?? '—'),
        carbonPreview: Number.isNaN(carbonNumeric) ? '—' : carbonNumeric.toFixed(2)
      }
    })
    .filter(Boolean)
)

const displayedRows = computed(() =>
  activityDataWithThreshold.value.filter((row) => {
    if (applied.source.trim() && !row.source.includes(applied.source.trim())) return false
    if (applied.collection && row.collection !== applied.collection) return false
    if (applied.thresholdStatus && row.monthlyThresholdStatus !== applied.thresholdStatus && row.annualThresholdStatus !== applied.thresholdStatus) return false
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

function getSourceLabel(sourceId) {
  return getEmissionSourceById(sourceId)?.name ?? sourceId
}

function resolveRecordPeriod(source, syncedAt) {
  const base = syncedAt ?? ''
  if (source?.collection === '自动采集') return base.slice(0, 10) || '—'
  return base.slice(0, 7) || '—'
}

function syncCollectEntries(ids) {
  const next = { ...collectEntries.value }
  for (const id of ids) {
    const source = getEmissionSourceById(id)
    if (source?.collection === '手动录入' && !next[id]) {
      next[id] = {
        recordPeriod: '',
        energyValue: '',
        unit: source.activityUnit ?? '—'
      }
    }
  }
  for (const id of Object.keys(next)) {
    if (!ids.includes(id)) delete next[id]
  }
  collectEntries.value = next
}

function openCollectDialog() {
  selectedCollectIds.value = []
  collectEntries.value = {}
  collectDialogVisible.value = true
}

function resetCollectForm() {
  selectedCollectIds.value = []
  collectEntries.value = {}
}

function submitCollect() {
  if (!selectedCollectIds.value.length) {
    ElMessage.warning('请选择排放源')
    return
  }

  const entries = []
  for (const sourceId of selectedCollectIds.value) {
    const source = getEmissionSourceById(sourceId)
    if (!source) continue

    if (source.collection === '手动录入') {
      const entry = collectEntries.value[sourceId]
      if (!entry?.recordPeriod?.trim()) {
        ElMessage.warning(`请填写「${source.name}」的最新记录周期`)
        return
      }
      const numericValue = parseActivityNumeric(entry.energyValue)
      if (numericValue == null) {
        ElMessage.warning(`请填写「${source.name}」的有效能值`)
        return
      }
      entries.push({
        sourceId,
        recordPeriod: entry.recordPeriod.trim(),
        numericValue,
        energyValue: formatEnergyValue(numericValue)
      })
    } else {
      if (source.numericEnergyValue == null) {
        ElMessage.warning(`排放源「${source.name}」暂无接口能值，无法采集`)
        return
      }
      entries.push({ sourceId })
    }
  }

  const count = collectActivityFromSources(entries)
  collectDialogVisible.value = false
  ElMessage.success(`已采集 ${count} 条活动数据`)
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
.manual-entry-block {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #f6f8fa;
  border: 1px solid var(--yy-border);
  border-radius: 8px;
}
.manual-entry-block:last-child { margin-bottom: 0; }
.manual-entry-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
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
