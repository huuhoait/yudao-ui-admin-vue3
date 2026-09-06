<template>
  <el-form-item>
    <el-alert
      title="Only POST requests are supported; parameters are read from the request body"
      type="warning"
      show-icon
      :closable="false"
    />
  </el-form-item>
  <!-- 请求地址-->
  <el-form-item
    label-position="top"
    label="Request URL"
    :prop="`${formItemPrefix}.url`"
    :rules="{
      required: true,
      message: 'Request URL is required',
      trigger: 'blur'
    }"
  >
    <el-input v-model="setting.url" />
  </el-form-item>
  <!-- 请求头，请求体设置-->
  <HttpRequestParamSetting :header="setting.header" :body="setting.body" :bind="formItemPrefix" />
  <!-- 返回值设置-->
  <div v-if="responseEnable">
    <el-form-item label="Response" label-position="top">
      <el-alert
        title="The response can be used to update the values of the process form"
        type="warning"
        show-icon
        :closable="false"
      />
    </el-form-item>
    <el-form-item>
      <div class="flex pt-4" v-for="(item, index) in setting.response" :key="index">
        <div class="mr-2">
          <el-form-item
            :prop="`${formItemPrefix}.response.${index}.key`"
            :rules="{
              required: true,
              message: 'Form field is required',
              trigger: 'blur'
            }"
          >
            <el-select class="w-160px!" v-model="item.key" placeholder="Please select a form field">
              <el-option
                v-for="(field, fIdx) in formFields"
                :key="fIdx"
                :label="field.title"
                :value="field.field"
                :disabled="!field.required"
              />
            </el-select>
          </el-form-item>
        </div>
        <div class="mr-2">
          <el-form-item
            :prop="`${formItemPrefix}.response.${index}.value`"
            :rules="{
              required: true,
              message: 'Response field is required',
              trigger: 'blur'
            }"
          >
            <el-input class="w-160px" v-model="item.value" placeholder="Response Field" />
          </el-form-item>
        </div>
        <div class="mr-1 pt-1 cursor-pointer">
          <Icon
            icon="ep:delete"
            :size="18"
            @click="deleteHttpResponseSetting(setting.response!, Number(index))"
          />
        </div>
      </div>
    </el-form-item>
    <div class="pt-1">
      <el-button type="primary" text @click="addHttpResponseSetting(setting.response!)">
        <Icon icon="ep:plus" class="mr-5px" />Add a Row
      </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import HttpRequestParamSetting from './HttpRequestParamSetting.vue'
import { useFormFields } from '../../node'

const props = defineProps({
  setting: {
    type: Object,
    required: true
  },
  responseEnable: {
    type: Boolean,
    required: true
  },
  formItemPrefix: {
    type: String,
    required: true
  }
})
const { setting } = toRefs(props)
const emits = defineEmits(['update:setting'])
watch(
  () => setting,
  (val) => {
    emits('update:setting', val)
  }
)

/** 流程表单字段 */
const formFields = useFormFields()

/** 添加 HTTP 请求返回值设置项 */
const addHttpResponseSetting = (responseSetting: Record<string, string>[]) => {
  responseSetting.push({
    key: '',
    value: ''
  })
}

/** 删除 HTTP 请求返回值设置项 */
const deleteHttpResponseSetting = (responseSetting: Record<string, string>[], index: number) => {
  responseSetting.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
