<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item :label="t('bpm.processListener.form.name')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('bpm.processListener.form.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.form.status')" prop="status">
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
      <el-form-item :label="t('bpm.processListener.form.type')" prop="type">
        <el-select
          v-model="formData.type"
          :placeholder="t('bpm.processListener.form.typePlaceholder')"
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
      <el-form-item :label="t('bpm.processListener.form.event')" prop="event">
        <el-select v-model="formData.event" :placeholder="t('bpm.processListener.form.eventPlaceholder')">
          <el-option
            v-for="event in formData.type == 'execution'
              ? ['start', 'end']
              : ['create', 'assignment', 'complete', 'delete', 'update', 'timeout']"
            :label="event"
            :value="event"
            :key="event"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.form.valueType')" prop="valueType">
        <el-select
          v-model="formData.valueType"
          :placeholder="t('bpm.processListener.form.valueTypePlaceholder')"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.form.classPath')" prop="value" v-if="formData.type == 'class'">
        <el-input v-model="formData.value" :placeholder="t('bpm.processListener.form.classPathPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('bpm.processListener.form.expression')" prop="value" v-else>
        <el-input v-model="formData.value" :placeholder="t('bpm.processListener.form.expressionPlaceholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">
        {{ t('common.confirm') }}
      </el-button>
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
  id: undefined,
  name: undefined,
  type: undefined,
  status: undefined,
  event: undefined,
  valueType: undefined,
  value: undefined
})
const formRules = reactive({
  name: [{ required: true, message: t('bpm.processListener.form.rules.name'), trigger: 'blur' }],
  type: [{ required: true, message: t('bpm.processListener.form.rules.type'), trigger: 'change' }],
  status: [{ required: true, message: t('bpm.processListener.form.rules.status'), trigger: 'blur' }],
  event: [{ required: true, message: t('bpm.processListener.form.rules.event'), trigger: 'blur' }],
  valueType: [{ required: true, message: t('bpm.processListener.form.rules.valueType'), trigger: 'change' }],
  value: [{ required: true, message: t('bpm.processListener.form.rules.value'), trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
