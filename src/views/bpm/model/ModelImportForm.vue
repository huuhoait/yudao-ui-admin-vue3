<template>
  <Dialog v-model="dialogVisible" :title="t('bpm.model.importProcessModel')" width="640">
    <el-alert
      class="mb-15px"
      :description="t('bpm.model._todo38')"
      show-icon
      :title="t('bpm.model.importInstructions')"
      type="info"
    />
    <el-form ref="formRef" :model="formData" label-width="100px">
      <el-form-item :label="t('bpm.model.processModelFile')">
        <el-upload
          v-model:file-list="fileList"
          :auto-upload="false"
          :limit="1"
          accept=".json"
          drag
          :on-change="handleChange"
          :on-remove="resetFile"
        >
          <Icon class="mb-10px" icon="ep:upload-filled" :size="32" />
          <div>{{ t('bpm.model._todo41') }}</div>
        </el-upload>
      </el-form-item>
      <el-form-item :label="t('bpm.model.processKey')" prop="key" :rules="formRules.key">
        <el-input v-model="formData.key" :placeholder="t('bpm.model.inputProcessKey')" />
      </el-form-item>
      <el-form-item :label="t('bpm.model.processName')" prop="name" :rules="formRules.name">
        <el-input v-model="formData.name" :placeholder="t('bpm.model.inputProcessName')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">{{ t('common.ok') }}</el-button>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules, UploadFile, UploadUserFile } from 'element-plus'

import * as ModelApi from '@/api/bpm/model'

defineOptions({ name: 'BpmModelImportForm' })
const { t } = useI18n() // 国际化

const emit = defineEmits(['success'])
const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const file = ref<File>()
const fileList = ref<UploadUserFile[]>([])
const formRef = ref<FormInstance>()
const formData = reactive({ key: '', name: '' })
const formRules: FormRules = {
  key: [{ required: true, message: t('bpm.model.inputProcessKey') }],
  name: [{ required: true, message: t('bpm.model.inputProcessName') }]
}

const open = () => {
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open })

const handleChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return
  if (!uploadFile.name.toLowerCase().endsWith('.json')) {
    message.error(t('bpm.model._todo42'))
    resetFile()
    return
  }
  try {
    const data = JSON.parse(await uploadFile.raw.text())
    file.value = uploadFile.raw
    formData.key = data.key || ''
    formData.name = data.name || ''
  } catch {
    resetFile()
    message.error(t('bpm.model.invalidJsonFileFormat'))
  }
}

const submitForm = async () => {
  if (!file.value) return message.warning(t('bpm.model._todo44'))
  await formRef.value?.validate()
  formLoading.value = true
  try {
    await ModelApi.importModel(file.value, formData.key, formData.name)
    message.success(t('bpm.model.importSucceeded'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetFile = () => {
  file.value = undefined
  fileList.value = []
}

const resetForm = () => {
  resetFile()
  formData.key = ''
  formData.name = ''
  formRef.value?.clearValidate()
}
</script>
