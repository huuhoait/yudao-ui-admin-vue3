<template>
  <el-form ref="listenerFormRef" :model="configForm" label-position="top">
    <div v-for="(listener, listenerIdx) in taskListener" :key="listenerIdx">
      <el-divider content-position="left">
        <el-text tag="b" size="large">{{ t(listener.name) }}</el-text>
      </el-divider>
      <el-form-item>
        <el-switch
          v-model="configForm[`task${listener.type}ListenerEnable`]"
          :active-text="t('common.enable')"
          :inactive-text="t('common.disable')"
        />
      </el-form-item>
      <div v-if="configForm[`task${listener.type}ListenerEnable`]">
        <el-form-item>
          <el-alert
            :title="t('bpm.design.httpRequest.postOnlyWarning')"
            type="warning"
            show-icon
            :closable="false"
          />
        </el-form-item>
        <el-form-item
          :label="t('bpm.design.httpRequest.requestUrl')"
          :prop="`task${listener.type}ListenerPath`"
          :rules="{
            required: true,
            message: t('bpm.design.httpRequest.requestUrlRequired'),
            trigger: 'blur'
          }"
        >
          <el-input v-model="configForm[`task${listener.type}ListenerPath`]" />
        </el-form-item>
        <HttpRequestParamSetting
          :header="configForm[`task${listener.type}Listener`].header"
          :body="configForm[`task${listener.type}Listener`].body"
          :bind="`task${listener.type}Listener`"
        />
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import HttpRequestParamSetting from './HttpRequestParamSetting.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  formFieldOptions: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:modelValue'])
const listenerFormRef = ref()
const configForm = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
const taskListener = ref([
  {
    name: 'simpleProcessDesignerV2.userTaskListener.createTask',
    type: 'Create'
  },
  {
    name: 'simpleProcessDesignerV2.userTaskListener.assignTask',
    type: 'Assign'
  },
  {
    name: 'simpleProcessDesignerV2.userTaskListener.completeTask',
    type: 'Complete'
  }
])

const validate = async () => {
  if (!listenerFormRef) return false
  return await listenerFormRef.value.validate()
}

defineExpose({ validate })
</script>
