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
      在本页<strong>设置监控</strong>后，系统将<strong>持续监控</strong>所选排放源，无需重新采集。数据来源因排放源而异：
      <strong>自动采集</strong>为接口实时监测；<strong>系统对接</strong>为月度批量传输；<strong>手动录入</strong>需通过「导入数据记录」按周期手工录入。
      列表展示各排放源<strong>最新一条</strong>监测数据，点击「数据记录」可<strong>追溯历史</strong>。阈值在「阈值设置」中统一配置。
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">监控数据明细</span>
          <span class="toolbar-sub">监控中 {{ displayedRows.length }} 个排放源</span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="filterCollection" placeholder="全部数据采集" clearable style="width: 130px">
            <el-option label="自动采集" value="自动采集" />
            <el-option label="系统对接" value="系统对接" />
            <el-option label="手动录入" value="手动录入" />
          </el-select>
          <el-select v-model="filterThreshold" placeholder="监控状态" clearable style="width: 130px">
            <el-option label="正常" value="正常" />
            <el-option label="超上限" value="超上限" />
            <el-option label="超下限" value="超下限" />
          </el-select>
          <el-button @click="openThresholdSettings">阈值设置</el-button>
        </div>
      </div>

      <div class="list-toolbar-row">
        <div class="list-add-bar">
          <el-button type="primary" @click="openMonitorDialog">+ 设置监控</el-button>
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
            <th>阈值范围</th>
            <th>监控状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedRows.length === 0">
            <td colspan="11" class="empty-cell">暂无监控中的排放源，请点击「设置监控」添加</td>
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
    <el-dialog v-model="thresholdDialogVisible" title="活动数据阈值设置" width="720px" destroy-on-close>
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

    <!-- 设置监控 -->
    <el-dialog v-model="monitorDialogVisible" title="设置监控" width="640px" destroy-on-close @closed="selectedSourceIds = []">
      <div class="import-tip carbon-mb-12">
        选择排放源后将<strong>持续监控</strong>，系统按数据采集方式自动接收或等待导入数据记录。
      </div>
      <el-form label-position="top">
        <el-form-item label="选择排放源" required>
          <el-select v-model="selectedSourceIds" multiple filterable collapse-tags style="width: 100%" placeholder="从未监控的排放源中选择">
            <el-option
              v-for="s in collectableEmissionSources"
              :key="s.id"
              :label="`${s.name}（${collectionFrequencyMap[s.collection]?.label ?? s.collection}）`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <div v-if="!collectableEmissionSources.length" class="empty-hint">所有启用排放源均已设置监控。</div>
      </el-form>
      <template #footer>
        <el-button @click="monitorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMonitor">确认监控</el-button>
      </template>
    </el-dialog>

    <!-- 历史数据记录（仪表数据样式） -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`${historySource?.source ?? ''} — 数据记录`"
      width="980px"
      align-center
      destroy-on-close
      class="activity-record-dialog"
      @opened="handleHistoryDialogOpened"
    >
      <CarbonActivityRecordPanel
        v-if="historySource"
        :source="historySource"
        :records="historyRecords"
      />
    </el-dialog>

    <!-- 导入数据记录（手工导入类型） -->
    <el-dialog v-model="importDialogVisible" title="导入数据记录" width="720px" destroy-on-close @closed="resetImport">
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
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'
import CarbonActivityRecordPanel from '@/components/carbon/CarbonActivityRecordPanel.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'
import { createRecordId, parseRecordCsv, downloadRecordTemplate } from '@/composables/useActivityData'

const {
  activityDataWithThreshold,
  activityStats,
  collectableEmissionSources,
  collectionFrequencyMap,
  thresholdSettingsRows,
  getEnrichedRecordsBySourceId,
  isSourceMonitored,
  resolveSourceByName,
  addMonitoring,
  deleteMonitoredActivity,
  addActivityRecordsBatch,
  saveActivityThresholdRules,
  formatThresholdRange
} = useCarbonBusiness()

const filterCollection = ref('')
const filterThreshold = ref('')
const monitorDialogVisible = ref(false)
const thresholdDialogVisible = ref(false)
const thresholdFormRows = ref([])
const historyDialogVisible = ref(false)
const historySource = ref(null)
const historyRecords = ref([])
const importDialogVisible = ref(false)
const importPreview = ref([])
const importErrors = ref([])
const selectedSourceIds = ref([])

const displayedRows = computed(() =>
  activityDataWithThreshold.value.filter((row) => {
    if (filterCollection.value && row.collection !== filterCollection.value) return false
    if (filterThreshold.value && row.thresholdStatus !== filterThreshold.value) return false
    return true
  })
)

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

function openMonitorDialog() {
  selectedSourceIds.value = []
  monitorDialogVisible.value = true
}

function submitMonitor() {
  if (!selectedSourceIds.value.length) {
    ElMessage.warning('请选择要监控的排放源')
    return
  }
  addMonitoring(selectedSourceIds.value)
  monitorDialogVisible.value = false
  ElMessage.success(`已设置 ${selectedSourceIds.value.length} 个排放源持续监控`)
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

:deep(.activity-record-dialog .el-dialog__body) {
  padding: 0;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
</style>
