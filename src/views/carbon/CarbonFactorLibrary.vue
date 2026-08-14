<template>
  <CarbonPageShell page-title="排放因子库">
    <div class="carbon-card flow-tip carbon-mb-12">
      <strong>业务说明：</strong>
      维护国家标准、行业、区域电网及自定义排放因子，配置因子值、计量单位、适用燃料/物料与来源标准。排放源管理将引用此处的因子进行碳排放核算。
    </div>
    <div class="factor-layout">
      <aside class="carbon-card factor-sidebar">
        <button
          v-for="cat in categoryList"
          :key="cat.id"
          type="button"
          class="factor-tab"
          :class="{ 'is-active': activeCategory === cat.id }"
          @click="switchCategory(cat.id)"
        >
          <span>{{ cat.label }}</span>
          <span class="factor-count">{{ cat.count }}</span>
        </button>
      </aside>

      <div class="factor-main">
        <div class="carbon-card">
          <div class="toolbar">
            <div class="toolbar-left">
              <span class="toolbar-title">排放因子列表</span>
              <span class="toolbar-sub">{{ activeCategoryLabel }} · 共 {{ displayedFactors.length }} 条</span>
            </div>
          </div>

          <div class="filter-bar">
            <el-input v-model="filters.keyword" placeholder="因子名称" clearable style="width: 160px" />
            <el-select v-model="filters.material" placeholder="适用燃料/物料" clearable style="width: 140px">
              <el-option v-for="m in materialOptions" :key="m" :label="m" :value="m" />
            </el-select>
            <el-select v-model="filters.standard" placeholder="来源标准" clearable style="width: 160px">
              <el-option v-for="s in standardOptions" :key="s" :label="s" :value="s" />
            </el-select>
            <el-date-picker
              v-model="filters.changeDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="变更开始"
              end-placeholder="变更结束"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
            <el-button type="primary" @click="applyFilters">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>

          <div v-if="filtersApplied && applied.changeDateRange?.length" class="filter-tip">
            变更区间 {{ applied.changeDateRange[0] }} 至 {{ applied.changeDateRange[1] }}，
            筛选出 <strong>{{ displayedFactors.length }}</strong> 条发生过变更的因子
          </div>

          <div class="list-toolbar-row">
            <div class="list-add-bar">
              <el-button type="primary" @click="openCreate">新增</el-button>
            </div>
            <div class="list-io-bar">
              <el-button @click="openImport">导入</el-button>
              <el-button @click="handleExport">导出</el-button>
            </div>
          </div>

          <table class="carbon-table">
            <thead>
              <tr>
                <th>因子名称</th>
                <th>因子值</th>
                <th>单位</th>
                <th>适用燃料/物料</th>
                <th>来源标准</th>
                <th>当前版本</th>
                <th>更新时间</th>
                <th v-if="filtersApplied && applied.changeDateRange?.length">区间内变更</th>
                <th>变更次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="displayedFactors.length === 0">
                <td :colspan="tableColspan" class="empty-cell">暂无符合条件的排放因子</td>
              </tr>
              <tr v-for="row in displayedFactors" :key="row.id">
                <td>{{ row.name }}</td>
                <td>{{ row.value }}</td>
                <td>{{ row.unit }}</td>
                <td>{{ row.material }}</td>
                <td>{{ row.standard }}</td>
                <td><el-tag size="small" effect="plain">{{ row.version }}</el-tag></td>
                <td>{{ row.updated }}</td>
                <td v-if="filtersApplied && applied.changeDateRange?.length">
                  {{ getLatestChangeInRange(row) }}
                </td>
                <td>
                  <el-tag type="info" size="small" effect="light">{{ row.changeHistory.length }} 次</el-tag>
                </td>
                <td class="action-cell">
                  <span class="carbon-link" @click="openEdit(row)">编辑</span>
                  <span class="carbon-link carbon-link--danger" @click="handleDelete(row)">删除</span>
                  <span class="carbon-link" @click="openHistory(row.id)">变更记录</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'create' ? '新增排放因子' : '编辑排放因子'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" label-position="top">
        <el-form-item label="因子名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入因子名称" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="因子值" prop="value">
            <el-input v-model="form.value" placeholder="如：26.344" />
          </el-form-item>
          <el-form-item label="单位" prop="unit">
            <el-input v-model="form.unit" placeholder="如：GJ/t" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="适用燃料/物料" prop="material">
            <el-input v-model="form.material" placeholder="如：烟煤、电网" />
          </el-form-item>
          <el-form-item label="来源标准" prop="standard">
            <el-input v-model="form.standard" placeholder="如：GB/T 32150-2015" />
          </el-form-item>
        </div>
        <el-form-item v-if="formMode === 'edit'" label="变更原因" prop="changeReason">
          <el-input v-model="form.changeReason" type="textarea" :rows="2" placeholder="请填写本次修改原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入 -->
    <el-dialog v-model="importDialogVisible" title="导入排放因子" width="640px" destroy-on-close @closed="resetImport">
      <div class="import-tip">
        导入数据将添加到当前分类「{{ activeCategoryLabel }}」，请使用 CSV 格式。
        <span class="carbon-link" @click="downloadTemplate">下载导入模板</span>
      </div>
      <el-upload
        drag
        accept=".csv"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleImportFile"
      >
        <div class="upload-inner">
          <p>将 CSV 文件拖到此处，或点击上传</p>
          <p class="upload-sub">必填列：因子名称、因子值、单位、适用燃料/物料、来源标准</p>
        </div>
      </el-upload>
      <div v-if="importPreview.length" class="import-preview">
        <div class="preview-title">预览（{{ importPreview.length }} 条）</div>
        <table class="carbon-table">
          <thead>
            <tr>
              <th>因子名称</th>
              <th>因子值</th>
              <th>单位</th>
              <th>适用燃料/物料</th>
              <th>来源标准</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in importPreview" :key="idx">
              <td>{{ row.name }}</td>
              <td>{{ row.value }}</td>
              <td>{{ row.unit }}</td>
              <td>{{ row.material }}</td>
              <td>{{ row.standard }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="importError" class="import-error">{{ importError }}</div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importPreview.length" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 变更记录 -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="historyDialogTitle"
      width="680px"
      align-center
      destroy-on-close
    >
      <div v-if="activeFactor" class="history-dialog">
        <div class="factor-summary carbon-card">
          <div class="summary-row"><span>当前版本</span><el-tag size="small">{{ activeFactor.version }}</el-tag></div>
          <div class="summary-row"><span>当前因子值</span><strong>{{ activeFactor.value }} {{ activeFactor.unit }}</strong></div>
          <div class="summary-row"><span>最近更新</span><span>{{ activeFactor.updated }}</span></div>
          <div class="summary-row"><span>累计变更</span><span>{{ activeFactor.changeHistory.length }} 次</span></div>
        </div>
        <h4 class="history-title">变更时间线</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in activeFactor.changeHistory"
            :key="idx"
            :timestamp="log.time"
            placement="top"
          >
            <div class="timeline-card">
              <div class="timeline-head">
                <el-tag size="small" effect="plain">{{ log.version }}</el-tag>
                <span class="timeline-field">{{ log.field }}</span>
              </div>
              <div class="timeline-change">
                <span class="old-val">{{ log.oldValue }}</span>
                <span class="arrow">→</span>
                <span class="new-val">{{ log.newValue }}</span>
              </div>
              <div class="timeline-meta">操作人：{{ log.operator }}</div>
              <div class="timeline-reason">{{ log.reason }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </CarbonPageShell>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import {
  bumpVersion,
  buildCategoryCounts,
  cloneFactors,
  createChangeLog,
  createFactorId,
  defaultStandard,
  exportFactorsToCsv,
  formatDate,
  initialFactors,
  IMPORT_TEMPLATE,
  parseFactorCsv
} from '@/composables/useEmissionFactors'

const factorList = ref(cloneFactors(initialFactors))
const activeCategory = ref('national')
const filtersApplied = ref(false)
const historyDialogVisible = ref(false)
const activeFactorId = ref(null)

const formDialogVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)
const formRef = ref(null)

const importDialogVisible = ref(false)
const importPreview = ref([])
const importError = ref('')

const filters = reactive({
  keyword: '',
  material: '',
  standard: '',
  changeDateRange: null
})

const applied = reactive({
  keyword: '',
  material: '',
  standard: '',
  changeDateRange: null
})

const form = reactive({
  name: '',
  value: '',
  unit: '',
  material: '',
  standard: '',
  changeReason: ''
})

const formRules = computed(() => {
  const rules = {
    name: [{ required: true, message: '请输入因子名称', trigger: 'blur' }],
    value: [{ required: true, message: '请输入因子值', trigger: 'blur' }],
    unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
    material: [{ required: true, message: '请输入适用燃料/物料', trigger: 'blur' }],
    standard: [{ required: true, message: '请输入来源标准', trigger: 'blur' }]
  }
  if (formMode.value === 'edit') {
    rules.changeReason = [{ required: true, message: '请填写变更原因', trigger: 'blur' }]
  }
  return rules
})

const categoryList = computed(() => buildCategoryCounts(factorList.value))

const activeCategoryLabel = computed(
  () => categoryList.value.find((c) => c.id === activeCategory.value)?.label ?? ''
)

const categoryFactors = computed(() =>
  factorList.value.filter((f) => f.category === activeCategory.value)
)

const materialOptions = computed(() =>
  [...new Set(categoryFactors.value.map((f) => f.material))]
)

const standardOptions = computed(() =>
  [...new Set(categoryFactors.value.map((f) => f.standard))]
)

const changedFactorIdsInRange = computed(() => {
  if (!applied.changeDateRange?.length) return null
  const [start, end] = applied.changeDateRange
  const startTs = new Date(`${start} 00:00:00`).getTime()
  const endTs = new Date(`${end} 23:59:59`).getTime()
  const ids = new Set()
  for (const factor of categoryFactors.value) {
    if (
      factor.changeHistory.some((log) => {
        const t = new Date(log.time).getTime()
        return t >= startTs && t <= endTs
      })
    ) {
      ids.add(factor.id)
    }
  }
  return ids
})

const displayedFactors = computed(() => {
  let list = categoryFactors.value
  if (applied.keyword.trim()) {
    list = list.filter((f) => f.name.includes(applied.keyword.trim()))
  }
  if (applied.material) list = list.filter((f) => f.material === applied.material)
  if (applied.standard) list = list.filter((f) => f.standard === applied.standard)
  if (changedFactorIdsInRange.value) {
    list = list.filter((f) => changedFactorIdsInRange.value.has(f.id))
  }
  return list
})

const tableColspan = computed(() =>
  filtersApplied.value && applied.changeDateRange?.length ? 10 : 9
)

const activeFactor = computed(() =>
  factorList.value.find((f) => f.id === activeFactorId.value) ?? null
)

const historyDialogTitle = computed(() =>
  activeFactor.value ? `${activeFactor.value.name} — 变更记录` : '变更记录'
)

function switchCategory(catId) {
  activeCategory.value = catId
  resetFilters()
}

function applyFilters() {
  applied.keyword = filters.keyword
  applied.material = filters.material
  applied.standard = filters.standard
  applied.changeDateRange = filters.changeDateRange ? [...filters.changeDateRange] : null
  filtersApplied.value = true
}

function resetFilters() {
  filters.keyword = ''
  filters.material = ''
  filters.standard = ''
  filters.changeDateRange = null
  applied.keyword = ''
  applied.material = ''
  applied.standard = ''
  applied.changeDateRange = null
  filtersApplied.value = false
}

function getLatestChangeInRange(row) {
  if (!applied.changeDateRange?.length) return '—'
  const [start, end] = applied.changeDateRange
  const startTs = new Date(`${start} 00:00:00`).getTime()
  const endTs = new Date(`${end} 23:59:59`).getTime()
  const inRange = row.changeHistory
    .filter((log) => {
      const t = new Date(log.time).getTime()
      return t >= startTs && t <= endTs
    })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  if (!inRange.length) return '—'
  const latest = inRange[0]
  return `${latest.time.slice(0, 10)} ${latest.oldValue}→${latest.newValue}`
}

function openHistory(factorId) {
  activeFactorId.value = factorId
  historyDialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.value = ''
  form.unit = ''
  form.material = ''
  form.standard = defaultStandard(activeCategory.value)
  form.changeReason = ''
  editingId.value = null
  formRef.value?.clearValidate()
}

function openCreate() {
  formMode.value = 'create'
  resetForm()
  form.standard = defaultStandard(activeCategory.value)
  formDialogVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingId.value = row.id
  form.name = row.name
  form.value = row.value
  form.unit = row.unit
  form.material = row.material
  form.standard = row.standard
  form.changeReason = ''
  formDialogVisible.value = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (formMode.value === 'create') {
    const version = 'v1.0'
    const factor = {
      id: createFactorId(activeCategory.value),
      category: activeCategory.value,
      name: form.name.trim(),
      value: form.value.trim(),
      unit: form.unit.trim(),
      material: form.material.trim(),
      standard: form.standard.trim(),
      version,
      updated: formatDate(),
      changeHistory: [
        createChangeLog({
          version,
          field: '因子值',
          oldValue: '—',
          newValue: form.value.trim(),
          reason: '手动新增排放因子'
        })
      ]
    }
    factorList.value.unshift(factor)
    ElMessage.success('新增成功')
  } else {
    const idx = factorList.value.findIndex((f) => f.id === editingId.value)
    if (idx === -1) return
    const old = factorList.value[idx]
    const logs = [...old.changeHistory]
    const newVersion = bumpVersion(old.version)

    if (old.value !== form.value.trim()) {
      logs.unshift(
        createChangeLog({
          version: newVersion,
          field: '因子值',
          oldValue: old.value,
          newValue: form.value.trim(),
          reason: form.changeReason.trim()
        })
      )
    } else {
      logs.unshift(
        createChangeLog({
          version: newVersion,
          field: '基础信息',
          oldValue: old.name,
          newValue: form.name.trim(),
          reason: form.changeReason.trim()
        })
      )
    }

    factorList.value[idx] = {
      ...old,
      name: form.name.trim(),
      value: form.value.trim(),
      unit: form.unit.trim(),
      material: form.material.trim(),
      standard: form.standard.trim(),
      version: newVersion,
      updated: formatDate(),
      changeHistory: logs
    }
    ElMessage.success('保存成功')
  }

  formDialogVisible.value = false
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除排放因子「${row.name}」？删除后不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    factorList.value = factorList.value.filter((f) => f.id !== row.id)
    ElMessage.success('删除成功')
  } catch {
    /* cancelled */
  }
}

function openImport() {
  importPreview.value = []
  importError.value = ''
  importDialogVisible.value = true
}

function resetImport() {
  importPreview.value = []
  importError.value = ''
}

function downloadTemplate() {
  const blob = new Blob([`\uFEFF${IMPORT_TEMPLATE}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '排放因子导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportFile(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const { rows, error } = parseFactorCsv(String(e.target?.result ?? ''), activeCategory.value)
    importError.value = error || ''
    importPreview.value = error ? [] : rows
  }
  reader.readAsText(file, 'UTF-8')
}

function confirmImport() {
  if (!importPreview.value.length) return
  const imported = importPreview.value.map((row) => ({
    ...row,
    id: createFactorId(activeCategory.value),
    changeHistory: [
      createChangeLog({
        version: 'v1.0',
        field: '因子值',
        oldValue: '—',
        newValue: row.value,
        reason: '批量导入'
      })
    ]
  }))
  factorList.value.unshift(...imported)
  ElMessage.success(`成功导入 ${imported.length} 条排放因子`)
  importDialogVisible.value = false
}

function handleExport() {
  if (!displayedFactors.value.length) {
    ElMessage.warning('当前没有可导出的数据')
    return
  }
  const categoryName = activeCategoryLabel.value
  const date = formatDate()
  exportFactorsToCsv(displayedFactors.value, `${categoryName}_排放因子_${date}.csv`)
  ElMessage.success(`已导出 ${displayedFactors.value.length} 条数据`)
}
</script>

<style scoped>
.flow-tip {
  font-size: 13px;
  color: var(--yy-text-secondary);
  line-height: 1.6;
}
.factor-layout { display: flex; gap: 12px; align-items: flex-start; }
.factor-sidebar { width: 200px; flex-shrink: 0; padding: 8px; }
.factor-main { flex: 1; min-width: 0; }

.factor-tab {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; border: none; background: transparent; color: var(--yy-text-secondary);
  padding: 10px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; text-align: left;
}
.factor-tab:hover { background: #f5f5f5; color: var(--yy-text-primary); }
.factor-tab.is-active { background: var(--el-color-primary-light-9); color: var(--yy-primary); }
.factor-count {
  font-size: 12px; background: #f0f0f0; color: var(--yy-text-secondary);
  padding: 1px 6px; border-radius: 10px;
}
.factor-tab.is-active .factor-count { background: var(--el-color-primary-light-7); color: var(--yy-primary); }

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 12px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; gap: 8px; }

.filter-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  padding: 12px; background: #fafafa; border-radius: 4px; margin-bottom: 12px;
}

.filter-tip {
  margin-bottom: 12px; padding: 8px 12px; font-size: 13px; color: var(--yy-text-secondary);
  background: var(--el-color-primary-light-9); border-radius: 4px;
}

.empty-cell { text-align: center; color: var(--yy-text-placeholder); padding: 32px !important; }

.action-cell { white-space: nowrap; }
.carbon-link--danger { color: #ff4d4f; }
.carbon-link--danger:hover { color: #ff7875; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }

.import-tip { margin-bottom: 12px; font-size: 13px; color: var(--yy-text-secondary); }
.upload-inner { padding: 12px 0; color: var(--yy-text-secondary); }
.upload-sub { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 4px; }
.import-preview { margin-top: 16px; }
.preview-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.import-error { margin-top: 12px; color: #ff4d4f; font-size: 13px; }

.history-dialog { padding: 0 4px; max-height: 60vh; overflow-y: auto; }
.factor-summary { padding: 12px 16px; margin-bottom: 16px; }
.summary-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; padding: 6px 0; color: var(--yy-text-secondary);
}
.summary-row strong { color: var(--yy-text-primary); }
.history-title { margin: 0 0 12px; font-size: 14px; font-weight: 600; }

.timeline-card {
  background: #fafafa; border: 1px solid var(--yy-border); border-radius: 4px; padding: 10px 12px;
}
.timeline-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.timeline-field { font-size: 13px; font-weight: 500; }
.timeline-change { font-size: 13px; margin-bottom: 6px; }
.old-val { color: var(--yy-text-placeholder); text-decoration: line-through; }
.arrow { margin: 0 6px; color: var(--yy-text-placeholder); }
.new-val { color: var(--yy-primary); font-weight: 600; }
.timeline-meta { font-size: 12px; color: var(--yy-text-placeholder); margin-bottom: 4px; }
.timeline-reason { font-size: 12px; color: var(--yy-text-secondary); }

@media (max-width: 900px) {
  .factor-layout { flex-direction: column; }
  .factor-sidebar { width: 100%; display: flex; flex-wrap: wrap; gap: 4px; }
  .factor-tab { width: auto; flex: 1; min-width: 140px; }
}
</style>
