<template>
  <div class="panel-tab__content">
    <el-table :data="elementListenersList" size="small" border>
      <el-table-column :label="t('bpm.processDesigner.listeners.serialNumber')" width="50px" type="index" />
      <el-table-column :label="t('bpm.processDesigner.listeners.eventType')" min-width="100px" prop="event" />
      <el-table-column
        :label="t('bpm.processDesigner.listeners.listenerType')"
        min-width="100px"
        show-overflow-tooltip
        :formatter="(row) => listenerTypeObject[row.listenerType]"
      />
      <el-table-column :label="t('bpm.processDesigner.listeners.operation')" width="100px">
        <template #default="scope">
          <el-button size="small" link @click="openListenerForm(scope.row, scope.$index)">
            {{ t('common.edit') }}
          </el-button>
          <el-divider direction="vertical" />
          <el-button size="small" link style="color: #ff4d4f" @click="removeListener(scope.$index)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button">
      <XButton
        type="primary"
        preIcon="ep:plus"
        :title="t('bpm.processDesigner.listeners.addListener')"
        size="small"
        @click="openListenerForm(null)"
      />
      <XButton
        type="success"
        preIcon="ep:select"
        :title="t('bpm.processDesigner.listeners.selectListener')"
        size="small"
        @click="openProcessListenerDialog"
      />
    </div>

    <!-- 监听器 编辑/创建 部分 -->
    <el-drawer
      v-model="listenerFormModelVisible"
      :title="t('bpm.processDesigner.listeners.taskListener')"
      :size="`${width}px`"
      append-to-body
      destroy-on-close
    >
      <el-form :model="listenerForm" label-width="96px" ref="listenerFormRef">
        <el-form-item
          :label="t('bpm.processDesigner.listeners.eventType')"
          prop="event"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-select v-model="listenerForm.event">
            <el-option label="start" value="start" />
            <el-option label="end" value="end" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="t('bpm.processDesigner.listeners.listenerType')"
          prop="listenerType"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-select v-model="listenerForm.listenerType">
            <el-option
              v-for="i in Object.keys(listenerTypeObject)"
              :key="i"
              :label="listenerTypeObject[i]"
              :value="i"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="listenerForm.listenerType === 'classListener'"
          :label="t('bpm.processDesigner.listeners.javaClass')"
          prop="class"
          key="listener-class"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerForm.class" clearable />
        </el-form-item>
        <el-form-item
          v-if="listenerForm.listenerType === 'expressionListener'"
          :label="t('bpm.processDesigner.listeners.expression')"
          prop="expression"
          key="listener-expression"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerForm.expression" clearable />
        </el-form-item>
        <el-form-item
          v-if="listenerForm.listenerType === 'delegateExpressionListener'"
          :label="t('bpm.processDesigner.listeners.delegateExpression')"
          prop="delegateExpression"
          key="listener-delegate"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerForm.delegateExpression" clearable />
        </el-form-item>
        <template v-if="listenerForm.listenerType === 'scriptListener'">
          <el-form-item
            :label="t('bpm.processDesigner.listeners.scriptFormat')"
            prop="scriptFormat"
            key="listener-script-format"
            :rules="{ required: true, trigger: ['blur', 'change'], message: t('bpm.processDesigner.listeners.scriptFormatRequired') }"
          >
            <el-input v-model="listenerForm.scriptFormat" clearable />
          </el-form-item>
          <el-form-item
            :label="t('bpm.processDesigner.listeners.scriptType')"
            prop="scriptType"
            key="listener-script-type"
            :rules="{ required: true, trigger: ['blur', 'change'], message: t('bpm.processDesigner.listeners.scriptTypeRequired') }"
          >
            <el-select v-model="listenerForm.scriptType">
              <el-option :label="t('bpm.processDesigner.listeners.inlineScript')" value="inlineScript" />
              <el-option :label="t('bpm.processDesigner.listeners.externalScript')" value="externalScript" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="listenerForm.scriptType === 'inlineScript'"
            :label="t('bpm.processDesigner.listeners.scriptContent')"
            prop="value"
            key="listener-script"
            :rules="{ required: true, trigger: ['blur', 'change'], message: t('bpm.processDesigner.listeners.scriptContentRequired') }"
          >
            <el-input v-model="listenerForm.value" clearable />
          </el-form-item>
          <el-form-item
            v-if="listenerForm.scriptType === 'externalScript'"
            :label="t('bpm.processDesigner.listeners.resourceAddress')"
            prop="resource"
            key="listener-resource"
            :rules="{ required: true, trigger: ['blur', 'change'], message: t('bpm.processDesigner.listeners.resourceAddressRequired') }"
          >
            <el-input v-model="listenerForm.resource" clearable />
          </el-form-item>
        </template>
      </el-form>
      <el-divider />
      <p class="listener-filed__title">
        <span><Icon icon="ep:menu" />{{ t('bpm.processDesigner.listeners.injectionFields') }}：</span>
        <XButton type="primary" @click="openListenerFieldForm(null)" :title="t('bpm.processDesigner.listeners.addField')" />
      </p>
      <el-table
        :data="fieldsListOfListener"
        size="small"
        max-height="240"
        fit
        border
        style="flex: none"
      >
        <el-table-column :label="t('bpm.processDesigner.listeners.serialNumber')" width="50px" type="index" />
        <el-table-column :label="t('bpm.processDesigner.listeners.fieldName')" min-width="100px" prop="name" />
        <el-table-column
          :label="t('bpm.processDesigner.listeners.fieldType')"
          min-width="80px"
          show-overflow-tooltip
          :formatter="(row) => fieldTypeObject[row.fieldType]"
        />
        <el-table-column
          :label="t('bpm.processDesigner.listeners.fieldValueExpression')"
          min-width="100px"
          show-overflow-tooltip
          :formatter="(row) => row.string || row.expression"
        />
        <el-table-column :label="t('bpm.processDesigner.listeners.operation')" width="130px">
          <template #default="scope">
            <el-button size="small" link @click="openListenerFieldForm(scope.row, scope.$index)"
              >{{ t('common.edit') }}</el-button
            >
            <el-divider direction="vertical" />
            <el-button
              size="small"
              link
              style="color: #ff4d4f"
              @click="removeListenerField(scope.$index)"
              >{{ t('common.delete') }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="element-drawer__button">
        <el-button @click="listenerFormModelVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveListenerConfig">{{ t('common.save') }}</el-button>
      </div>
    </el-drawer>

    <!-- 注入西段 编辑/创建 部分 -->
    <el-dialog
      :title="t('bpm.processDesigner.listeners.fieldConfiguration')"
      v-model="listenerFieldFormModelVisible"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form
        :model="listenerFieldForm"
        label-width="96spx"
        ref="listenerFieldFormRef"
        style="height: 136px"
      >
        <el-form-item
          :label="t('bpm.processDesigner.listeners.fieldName') + '：'"
          prop="name"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerFieldForm.name" clearable />
        </el-form-item>
        <el-form-item
          :label="t('bpm.processDesigner.listeners.fieldType') + '：'"
          prop="fieldType"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-select v-model="listenerFieldForm.fieldType">
            <el-option
              v-for="i in Object.keys(fieldTypeObject)"
              :key="i"
              :label="fieldTypeObject[i]"
              :value="i"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="listenerFieldForm.fieldType === 'string'"
          :label="t('bpm.processDesigner.listeners.fieldValue') + '：'"
          prop="string"
          key="field-string"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerFieldForm.string" clearable />
        </el-form-item>
        <el-form-item
          v-if="listenerFieldForm.fieldType === 'expression'"
          :label="t('bpm.processDesigner.listeners.expression') + '：'"
          prop="expression"
          key="field-expression"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <el-input v-model="listenerFieldForm.expression" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="listenerFieldFormModelVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button size="small" type="primary" @click="saveListenerFiled">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>

  <!-- 选择弹窗 -->
  <ProcessListenerDialog ref="processListenerDialogRef" @select="selectProcessListener" />
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { createListenerObject, updateElementExtensions } from '../../utils'
import {
  initListenerType,
  initListenerForm,
  listenerType,
  fieldType,
  initListenerForm2
} from './utilSelf'
import ProcessListenerDialog from './ProcessListenerDialog.vue'

defineOptions({ name: 'ElementListeners' })

const { t } = useI18n()

const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')
const width = inject('width')
const elementListenersList = ref<any[]>([]) // 监听器列表
const listenerForm = ref<any>({}) // 监听器详情表单
const listenerFormModelVisible = ref(false) // 监听器 编辑 侧边栏显示状态
const fieldsListOfListener = ref<any[]>([])
const listenerFieldForm = ref<any>({}) // 监听器 注入字段 详情表单
const listenerFieldFormModelVisible = ref(false) // 监听器 注入字段表单弹窗 显示状态
const editingListenerIndex = ref(-1) // 监听器所在下标，-1 为新增
const editingListenerFieldIndex = ref(-1) // 字段所在下标，-1 为新增
const listenerTypeObject = ref(listenerType)
const fieldTypeObject = ref(fieldType)
const bpmnElement = ref()
const otherExtensionList = ref()
const bpmnElementListeners = ref()
const listenerFormRef = ref()
const listenerFieldFormRef = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const resetListenersList = () => {
  bpmnElement.value = bpmnInstances().bpmnElement
  otherExtensionList.value = []
  bpmnElementListeners.value =
    bpmnElement.value.businessObject?.extensionElements?.values?.filter(
      (ex) => ex.$type === `${prefix}:ExecutionListener`
    ) ?? []
  elementListenersList.value = bpmnElementListeners.value.map((listener) =>
    initListenerType(listener)
  )
}
// 打开 监听器详情 侧边栏
const openListenerForm = (listener, index?) => {
  // debugger
  if (listener) {
    listenerForm.value = initListenerForm(listener)
    editingListenerIndex.value = index
  } else {
    listenerForm.value = {}
    editingListenerIndex.value = -1 // 标记为新增
  }
  if (listener && listener.fields) {
    fieldsListOfListener.value = listener.fields.map((field) => ({
      ...field,
      fieldType: field.string ? 'string' : 'expression'
    }))
  } else {
    fieldsListOfListener.value = []
    listenerForm.value['fields'] = []
  }
  // 打开侧边栏并清楚验证状态
  listenerFormModelVisible.value = true
  nextTick(() => {
    if (listenerFormRef.value) {
      listenerFormRef.value.clearValidate()
    }
  })
}
// 打开监听器字段编辑弹窗
const openListenerFieldForm = (field, index?) => {
  listenerFieldForm.value = field ? JSON.parse(JSON.stringify(field)) : {}
  editingListenerFieldIndex.value = field ? index : -1
  listenerFieldFormModelVisible.value = true
  nextTick(() => {
    if (listenerFieldFormRef.value) {
      listenerFieldFormRef.value.clearValidate()
    }
  })
}
// 保存监听器注入字段
const saveListenerFiled = async () => {
  // debugger
  let validateStatus = await listenerFieldFormRef.value.validate()
  if (!validateStatus) return // 验证不通过直接返回
  if (editingListenerFieldIndex.value === -1) {
    fieldsListOfListener.value.push(listenerFieldForm.value)
    listenerForm.value.fields.push(listenerFieldForm.value)
  } else {
    fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value)
    listenerForm.value.fields.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value)
  }
  listenerFieldFormModelVisible.value = false
  nextTick(() => {
    listenerFieldForm.value = {}
  })
}
// 移除监听器字段
const removeListenerField = (index) => {
  // debugger
  ElMessageBox.confirm(t('bpm.processDesigner.listeners.confirmRemoveField'), t('common.confirmation'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })
    .then(() => {
      fieldsListOfListener.value.splice(index, 1)
      listenerForm.value.fields.splice(index, 1)
    })
    .catch(() => console.info(t('common.operationCancel')))
}
// 移除监听器
const removeListener = (index) => {
  ElMessageBox.confirm(t('bpm.processDesigner.listeners.confirmRemoveListener'), t('common.confirmation'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })
    .then(() => {
      bpmnElementListeners.value.splice(index, 1)
      elementListenersList.value.splice(index, 1)
      updateElementExtensions(
        bpmnElement.value,
        otherExtensionList.value.concat(bpmnElementListeners.value)
      )
    })
    .catch(() => console.info(t('common.operationCancel')))
}
// 保存监听器配置
const saveListenerConfig = async () => {
  // debugger
  let validateStatus = await listenerFormRef.value.validate()
  if (!validateStatus) return // 验证不通过直接返回
  const listenerObject = createListenerObject(listenerForm.value, false, prefix)
  if (editingListenerIndex.value === -1) {
    bpmnElementListeners.value.push(listenerObject)
    elementListenersList.value.push(listenerForm.value)
  } else {
    bpmnElementListeners.value.splice(editingListenerIndex.value, 1, listenerObject)
    elementListenersList.value.splice(editingListenerIndex.value, 1, listenerForm.value)
  }
  // 保存其他配置
  otherExtensionList.value =
    bpmnElement.value.businessObject?.extensionElements?.values?.filter(
      (ex) => ex.$type !== `${prefix}:ExecutionListener`
    ) ?? []
  updateElementExtensions(
    bpmnElement.value,
    otherExtensionList.value.concat(bpmnElementListeners.value)
  )
  // 4. 隐藏侧边栏
  listenerFormModelVisible.value = false
  listenerForm.value = {}
}

// 打开监听器弹窗
const processListenerDialogRef = ref()
const openProcessListenerDialog = async () => {
  processListenerDialogRef.value.open('execution')
}
const selectProcessListener = (listener) => {
  const listenerForm = initListenerForm2(listener)
  const listenerObject = createListenerObject(listenerForm, false, prefix)
  bpmnElementListeners.value.push(listenerObject)
  elementListenersList.value.push(listenerForm)

  // 保存其他配置
  otherExtensionList.value =
    bpmnElement.value.businessObject?.extensionElements?.values?.filter(
      (ex) => ex.$type !== `${prefix}:ExecutionListener`
    ) ?? []
  updateElementExtensions(
    bpmnElement.value,
    otherExtensionList.value.concat(bpmnElementListeners.value)
  )
}

watch(
  () => props.id,
  (val) => {
    val &&
      val.length &&
      nextTick(() => {
        resetListenersList()
      })
  },
  { immediate: true }
)
</script>
