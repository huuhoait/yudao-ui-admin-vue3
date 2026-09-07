<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item :label="t('bpm.processListener.name')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('bpm.processListener.inputName')" />
      </el-form-item>
      <el-form-item :label="t('common.status')" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.type')" prop="type">
        <el-select
          v-model="formData.type"
          :placeholder="t('bpm.processListener.selectType')"
          @change="formData.event = undefined"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.event')" prop="event">
        <el-select v-model="formData.event" :placeholder="t('bpm.processListener.selectEvent')">
          <el-option
            v-for="opt in formData.type == 'execution' ? executionListenerEvents : taskListenerEvents"
            :label="opt.label"
            :value="opt.value"
            :key="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.valueType')" prop="valueType">
        <el-select v-model="formData.valueType" :placeholder="t('bpm.processListener.selectValueType')">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.classPath')" prop="value" v-if="formData.type == 'class'">
        <el-input v-model="formData.value" :placeholder="t('bpm.processListener.inputClassPath')" />
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.expression')" prop="value" v-else>
        <el-input v-model="formData.value" :placeholder="t('bpm.processListener.inputExpression')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">{{ t('common.ok') }}</el-button>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProcessListenerApi, ProcessListenerVO } from '@/api/bpm/processListener'
import { CommonStatusEnum } from '@/utils/constants'

/** BPM 流程 表单 */
defineOptions({ name: 'ProcessListenerForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  type: undefined as string | undefined,
  status: undefined as number | undefined,
  event: undefined as string | undefined,
  valueType: undefined as string | undefined,
  value: undefined as string | undefined
})
const formRules = reactive({
  name: [{ required: true, message: t('bpm.processListener.nameRequired'), trigger: 'blur' }],
  type: [{ required: true, message: t('bpm.processListener.typeRequired'), trigger: 'change' }],
  status: [{ required: true, message: t('bpm.processListener.statusRequired'), trigger: 'blur' }],
  event: [{ required: true, message: t('bpm.processListener.listenerEventRequired'), trigger: 'blur' }],
  valueType: [{ required: true, message: t('bpm.processListener.valueTypeRequired'), trigger: 'change' }],
  value: [{ required: true, message: t('bpm.processListener.valueRequired'), trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

// 监听器事件的候选项：value 是 Flowable 监听器事件编码，保留原值以兼容已保存的数据，
// 仅 label 做国际化展示
const executionListenerEvents = [
  { value: '开始', label: t('bpm.processListener.eventStart') },
  { value: '结束', label: t('bpm.processListener.eventEnd') }
]
const taskListenerEvents = [
  { value: '创建', label: t('bpm.processListener.eventCreate') },
  { value: '指派', label: t('bpm.processListener.eventAssign') },
  { value: '完成', label: t('bpm.processListener.eventComplete') },
  { value: '删除', label: t('bpm.processListener.eventDelete') },
  { value: '更新', label: t('bpm.processListener.eventUpdate') },
  { value: '超时', label: t('bpm.processListener.eventTimeout') }
]

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProcessListenerApi.getProcessListener(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProcessListenerVO
    if (formType.value === 'create') {
      await ProcessListenerApi.createProcessListener(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProcessListenerApi.updateProcessListener(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    type: undefined,
    status: CommonStatusEnum.ENABLE,
    event: undefined,
    valueType: undefined,
    value: undefined
  }
  formRef.value?.resetFields()
}
</script>
