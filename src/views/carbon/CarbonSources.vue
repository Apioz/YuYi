<template>
  <CarbonPageShell page-title="排放源管理">
    <div class="carbon-card flow-tip carbon-mb-12">
      <strong>业务说明：</strong>
      在排放因子库维护物料/燃料因子后，在此定义需接入的排放源。数据采集方式决定监测频率：<strong>自动采集</strong>（接口实时）、<strong>系统对接</strong>（月度传输）、<strong>手动录入</strong>（手工导入记录）。能值由接口同步至排放源，在活动数据采集页设置监控后持续跟踪。
    </div>

    <div class="carbon-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">排放源清单</span>
          <span class="toolbar-sub">共 {{ filteredSources.length }} 个排放源</span>
        </div>
        <div class="toolbar-right">
          <el-input v-model="keyword" placeholder="搜索排放源..." clearable style="width: 180px" />
          <el-select v-model="filterScope" placeholder="全部范围" clearable style="width: 110px">
            <el-option label="Scope 1" value="Scope 1" />
            <el-option label="Scope 2" value="Scope 2" />
            <el-option label="Scope 3" value="Scope 3" />
          </el-select>
          <el-select v-model="filterPark" placeholder="全部园区" clearable style="width: 130px">
            <el-option v-for="p in parks" :key="p" :label="p" :value="p" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 110px">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </div>
      </div>

      <div class="list-toolbar-row">
        <div class="list-add-bar">
          <el-button type="primary" @click="openCreate">+ 新增排放源</el-button>
        </div>
        <div class="list-io-bar">
          <el-button @click="openImport">导入</el-button>
        </div>
      </div>

      <table class="carbon-table">
        <thead>
          <tr>
            <th>排放源名称</th>
            <th>排放类型</th>
            <th>GHG范围</th>
            <th>能源类型</th>
            <th>物料</th>
            <th>关联园区</th>
            <th>所属地块</th>
            <th>关联因子</th>
            <th>执行标准</th>
            <th>能值单位</th>
            <th>当前能值（接口）</th>
            <th>数据采集</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSources.length === 0">
            <td colspan="14" class="empty-cell">暂无排放源数据</td>
          </tr>
          <tr v-for="row in filteredSources" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.sourceType }}</td>
            <td><CarbonScopeTag :scope="row.scope" /></td>
            <td>{{ row.energyType }}</td>
            <td>{{ row.material }}</td>
            <td>{{ row.park }}</td>
            <td>{{ row.landParcel }}</td>
            <td>
              <span class="carbon-link" @click="goFactors">{{ row.factorName }}</span>
            </td>
            <td>
              <el-tag size="small" effect="plain">{{ getExecutionStandard(row.factorId) }}</el-tag>
            </td>
            <td>{{ row.activityUnit || '—' }}</td>
            <td class="readonly-cell">
              <template v-if="row.numericEnergyValue != null">{{ row.energyValue }} {{ row.activityUnit }}</template>
              <span v-else>—</span>
            </td>
            <td><CarbonQualityTag :label="row.collection" /></td>
            <td>
              <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small" effect="light">
                {{ row.status }}
              </el-tag>
            </td>
            <td class="action-cell">
              <span class="carbon-link" @click="openView(row)">查看</span>
              <span class="carbon-link" @click="openEdit(row)">编辑</span>
              <span class="carbon-link carbon-link--danger" @click="handleDelete(row)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formMode === 'create' ? '新增排放源' : '编辑排放源'"
      width="640px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form label-position="top">
        <el-form-item label="排放源名称" required>
          <el-input v-model="form.name" placeholder="如：3#回转窑" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="排放类型" required>
            <el-select v-model="form.sourceType" style="width: 100%">
              <el-option label="固定燃烧" value="固定燃烧" />
              <el-option label="移动燃烧" value="移动燃烧" />
              <el-option label="过程排放" value="过程排放" />
              <el-option label="外购电力" value="外购电力" />
              <el-option label="外购热力" value="外购热力" />
              <el-option label="其他间接" value="其他间接" />
            </el-select>
          </el-form-item>
          <el-form-item label="GHG范围" required>
            <el-select v-model="form.scope" style="width: 100%">
              <el-option label="Scope 1" value="Scope 1" />
              <el-option label="Scope 2" value="Scope 2" />
              <el-option label="Scope 3" value="Scope 3" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="能源类型" required>
            <el-select v-model="form.energyType" style="width: 100%">
              <el-option v-for="t in energyTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="物料" required>
            <el-input v-model="form.material" placeholder="如：烟煤、天然气、电网" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="关联园区" required>
            <el-select v-model="form.park" style="width: 100%">
              <el-option v-for="p in parks" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属地块" required>
            <el-select v-model="form.landParcel" style="width: 100%">
              <el-option v-for="l in landParcels" :key="l" :label="l" :value="l" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="关联排放因子" required>
            <el-select v-model="form.factorId" style="width: 100%" filterable @change="onFactorChange">
              <el-option
                v-for="f in allEmissionFactors"
                :key="f.id"
                :label="`${f.name}（${getFactorModuleLabel(f.category)}）`"
                :value="f.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数据采集">
            <el-select v-model="form.collection" style="width: 100%">
              <el-option label="自动采集" value="自动采集" />
              <el-option label="系统对接" value="系统对接" />
              <el-option label="手动录入" value="手动录入" />
              <el-option label="统计" value="统计" />
              <el-option label="估算" value="估算" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="能值单位" required>
            <el-select v-model="form.activityUnit" style="width: 100%" filterable allow-create default-first-option>
              <el-option label="t（吨）" value="t" />
              <el-option label="kWh（千瓦时）" value="kWh" />
              <el-option label="m³（立方米）" value="m³" />
              <el-option label="L（升）" value="L" />
              <el-option label="km（公里）" value="km" />
              <el-option label="GJ（吉焦）" value="GJ" />
            </el-select>
          </el-form-item>
          <el-form-item label="核算方法">
            <el-select v-model="form.method" style="width: 100%">
              <el-option label="排放因子法" value="排放因子法" />
              <el-option label="物料平衡法" value="物料平衡法" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="启用" value="启用" />
              <el-option label="停用" value="停用" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情 -->
    <el-dialog v-model="viewDialogVisible" title="排放源详情" width="680px" align-center destroy-on-close>
      <template v-if="viewSource">
        <div class="detail-section">
          <h4 class="detail-title">基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">排放源名称</span><span>{{ viewSource.name }}</span></div>
            <div class="detail-item"><span class="detail-label">排放类型</span><span>{{ viewSource.sourceType }}</span></div>
            <div class="detail-item"><span class="detail-label">GHG范围</span><span><CarbonScopeTag :scope="viewSource.scope" /></span></div>
            <div class="detail-item"><span class="detail-label">能源类型</span><span>{{ viewSource.energyType }}</span></div>
            <div class="detail-item"><span class="detail-label">物料</span><span>{{ viewSource.material }}</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span>{{ viewSource.status }}</span></div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-title">空间归属</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">关联园区</span><span>{{ viewSource.park }}</span></div>
            <div class="detail-item"><span class="detail-label">所属地块</span><span>{{ viewSource.landParcel }}</span></div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-title">核算配置</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">核算方法</span><span>{{ viewSource.method }}</span></div>
            <div class="detail-item"><span class="detail-label">数据采集</span><span>{{ viewSource.collection }}</span></div>
            <div class="detail-item"><span class="detail-label">能值单位</span><span>{{ viewSource.activityUnit || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">当前能值（接口）</span><span>{{ viewSource.energyValue ? `${viewSource.energyValue} ${viewSource.activityUnit}` : '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">同步时间</span><span>{{ viewSource.energySyncedAt || '—' }}</span></div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-title">关联排放因子</h4>
          <div v-if="viewFactor" class="factor-card">
            <div class="factor-name">{{ viewFactor.name }}</div>
            <div class="factor-meta">执行标准：{{ viewExecutionStandard }}</div>
            <div class="factor-meta">{{ viewFactor.value }} {{ viewFactor.unit }} · {{ viewFactor.material }}</div>
            <div class="factor-meta">来源标准：{{ viewFactor.standard }} · {{ viewFactor.version }}</div>
            <span class="carbon-link" @click="goFactors">前往因子库</span>
          </div>
          <div v-else class="detail-empty">未绑定排放因子</div>
        </div>
        <div v-if="viewLinkedActivity.length" class="detail-section">
          <h4 class="detail-title">最新监测数据</h4>
          <table class="carbon-table">
            <thead>
              <tr>
                <th>记录周期</th>
                <th>监测能值</th>
                <th>碳值 (tCO₂e)</th>
                <th>监控状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="act in viewLinkedActivity" :key="act.sourceId">
                <td>{{ act.hasData ? act.recordPeriod : '—' }}</td>
                <td>{{ act.hasData ? `${act.energyValue} ${act.unit}` : '—' }}</td>
                <td>{{ act.hasData ? act.carbonValue : '—' }}</td>
                <td>
                  <CarbonThresholdTag v-if="act.hasData" :status="act.thresholdStatus" />
                  <span v-else>未监控</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入 -->
    <el-dialog v-model="importDialogVisible" title="导入排放源" width="720px" destroy-on-close @closed="resetImport">
      <div class="import-tip">
        批量导入排放源，请使用 CSV 格式。关联因子需填写因子库中已有的因子名称。
        <span class="carbon-link" @click="downloadTemplate">下载导入模板</span>
      </div>
      <el-upload drag accept=".csv" :auto-upload="false" :show-file-list="false" :on-change="handleImportFile">
        <div class="upload-inner">
          <p>将 CSV 文件拖到此处，或点击上传</p>
          <p class="upload-sub">必填列：排放源名称、GHG范围、物料、关联因子</p>
        </div>
      </el-upload>
      <div v-if="importPreview.length" class="import-preview">
        <div class="preview-title">预览（{{ importPreview.length }} 条可导入）</div>
        <table class="carbon-table">
          <thead>
            <tr>
              <th>排放源名称</th>
              <th>GHG范围</th>
              <th>物料</th>
              <th>关联园区</th>
              <th>关联因子</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in importPreview" :key="idx">
              <td>{{ row.name }}</td>
              <td>{{ row.scope }}</td>
              <td>{{ row.material }}</td>
              <td>{{ row.park }}</td>
              <td>{{ row.factorName }}</td>
              <td>{{ row.status }}</td>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import CarbonPageShell from '@/components/carbon/CarbonPageShell.vue'
import CarbonScopeTag from '@/components/carbon/CarbonScopeTag.vue'
import CarbonQualityTag from '@/components/carbon/CarbonQualityTag.vue'
import CarbonThresholdTag from '@/components/carbon/CarbonThresholdTag.vue'
import { useCarbonBusiness } from '@/composables/useCarbonBusiness'
import { defaultActivityUnit } from '@/composables/useCarbonCalculation'
import {
  createSourceId,
  parseSourceCsv,
  downloadSourceTemplate
} from '@/composables/useEmissionSources'

const router = useRouter()
const {
  parks,
  landParcels,
  energyTypes,
  allEmissionFactors,
  emissionSourceList,
  activityDataWithThreshold,
  addEmissionSource,
  addEmissionSources,
  updateEmissionSource,
  deleteEmissionSource,
  getFactorById,
  getExecutionStandard,
  getFactorModuleLabel,
  getActivityDataBySourceId,
  isSourceMonitored,
  resolveFactorByName
} = useCarbonBusiness()

const keyword = ref('')
const filterScope = ref('')
const filterPark = ref('')
const filterStatus = ref('')
const dialogVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)

const viewDialogVisible = ref(false)
const viewSource = ref(null)

const importDialogVisible = ref(false)
const importPreview = ref([])
const importErrors = ref([])

const defaultForm = () => ({
  name: '',
  sourceType: '固定燃烧',
  scope: 'Scope 1',
  energyType: '化石燃料',
  material: '',
  park: 'igus园区',
  landParcel: 'A区-烧成线',
  factorId: '',
  factorName: '',
  method: '排放因子法',
  collection: '自动采集',
  activityUnit: 't',
  status: '启用'
})

const form = reactive(defaultForm())

const filteredSources = computed(() =>
  emissionSourceList.value.filter((row) => {
    if (keyword.value.trim() && !row.name.includes(keyword.value.trim())) return false
    if (filterScope.value && row.scope !== filterScope.value) return false
    if (filterPark.value && row.park !== filterPark.value) return false
    if (filterStatus.value && row.status !== filterStatus.value) return false
    return true
  })
)

const viewFactor = computed(() =>
  viewSource.value ? getFactorById(viewSource.value.factorId) : null
)

const viewExecutionStandard = computed(() =>
  viewSource.value ? getExecutionStandard(viewSource.value.factorId) : '—'
)

const viewLinkedActivity = computed(() => {
  if (!viewSource.value) return []
  return activityDataWithThreshold.value.filter((r) => r.sourceId === viewSource.value.id)
})

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

function openView(row) {
  viewSource.value = { ...row }
  viewDialogVisible.value = true
}

function resetForm() {
  Object.assign(form, defaultForm())
}

function onFactorChange(factorId) {
  const factor = getFactorById(factorId)
  form.factorName = factor?.name ?? ''
  if (formMode.value === 'create' && factor) {
    form.activityUnit = defaultActivityUnit(form.sourceType, factor)
  }
}

function submitForm() {
  if (!form.name?.trim()) {
    ElMessage.warning('请填写排放源名称')
    return
  }
  if (!form.factorId) {
    ElMessage.warning('请选择关联排放因子')
    return
  }
  if (!form.activityUnit?.trim()) {
    ElMessage.warning('请配置能值单位')
    return
  }

  const payload = {
    ...form,
    name: form.name.trim(),
    factorName: getFactorById(form.factorId)?.name ?? form.factorName
  }

  if (formMode.value === 'create') {
    const duplicate = emissionSourceList.value.some((s) => s.name === payload.name)
    if (duplicate) {
      ElMessage.warning('排放源名称已存在')
      return
    }
    addEmissionSource({ ...payload, id: createSourceId() })
    ElMessage.success('排放源已新增')
  } else {
    const duplicate = emissionSourceList.value.some(
      (s) => s.name === payload.name && s.id !== editingId.value
    )
    if (duplicate) {
      ElMessage.warning('排放源名称已存在')
      return
    }
    updateEmissionSource(editingId.value, payload)
    ElMessage.success('排放源已更新')
  }
  dialogVisible.value = false
}

async function handleDelete(row) {
  const linked = isSourceMonitored(row.id)
  const recordCount = linked ? getActivityDataBySourceId(row.id).length : 0
  const msg = linked
    ? `排放源「${row.name}」已设置监控并有 ${recordCount} 条数据记录，删除后监控与记录将不可用。确定删除？`
    : `确定删除排放源「${row.name}」？`

  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    deleteEmissionSource(row.id)
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
  downloadSourceTemplate()
}

function handleImportFile(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const { rows, errors } = parseSourceCsv(e.target.result, resolveFactorByName)
    importPreview.value = rows
    importErrors.value = errors
    if (!rows.length && errors.length) {
      ElMessage.error('导入文件解析失败，请检查格式')
    } else if (rows.length) {
      ElMessage.success(`已解析 ${rows.length} 条可导入数据`)
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function confirmImport() {
  if (!importPreview.value.length) return

  const existingNames = new Set(emissionSourceList.value.map((s) => s.name))
  const toAdd = []
  const skipped = []

  for (const row of importPreview.value) {
    if (existingNames.has(row.name)) {
      skipped.push(row.name)
      continue
    }
    toAdd.push({ ...row, id: createSourceId() })
    existingNames.add(row.name)
  }

  addEmissionSources(toAdd)
  importDialogVisible.value = false

  let msg = `成功导入 ${toAdd.length} 个排放源`
  if (skipped.length) msg += `，跳过 ${skipped.length} 个重名项`
  ElMessage.success(msg)
}

function goFactors() {
  router.push('/carbon/factors')
}
</script>

<style scoped>
.flow-tip {
  font-size: 13px;
  color: var(--yy-text-secondary);
  line-height: 1.6;
}
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 10px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.toolbar-sub { font-size: 12px; color: var(--yy-text-placeholder); }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.action-cell { white-space: nowrap; }
.carbon-link--danger { color: #ff4d4f; }
.carbon-link--danger:hover { color: #ff7875; }
.empty-cell { text-align: center; color: var(--yy-text-placeholder); padding: 32px !important; }

.detail-section { margin-bottom: 20px; }
.detail-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--yy-text-primary); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.detail-label { color: var(--yy-text-placeholder); font-size: 12px; }
.detail-empty { font-size: 13px; color: var(--yy-text-placeholder); }
.factor-card {
  padding: 12px 16px; background: #fafafa; border: 1px solid var(--yy-border); border-radius: 4px;
}
.factor-name { font-weight: 600; margin-bottom: 6px; }
.factor-meta { font-size: 12px; color: var(--yy-text-secondary); margin-bottom: 4px; }

.import-tip { margin-bottom: 12px; font-size: 13px; color: var(--yy-text-secondary); }
.upload-inner { padding: 12px 0; color: var(--yy-text-secondary); }
.upload-sub { font-size: 12px; color: var(--yy-text-placeholder); margin-top: 4px; }
.import-preview { margin-top: 16px; }
.preview-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.import-errors { margin-top: 12px; }
.import-error { color: #ff4d4f; font-size: 13px; line-height: 1.6; }
</style>
