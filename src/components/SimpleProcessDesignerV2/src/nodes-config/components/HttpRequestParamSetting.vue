<template>
  <el-form-item label-position="top" :label="t('simpleProcessDesignerV2.httpRequestParamSetting.header')">
    <div class="flex pb-4" v-for="(item, index) in props.header" :key="index">
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.header.${index}.key`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamKey'),
            trigger: 'blur'
          }"
        >
          <el-input v-model="item.key" style="width: 160px" :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramKeyPlaceholder')" />
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-form-item>
          <el-select v-model="item.type" style="width: 160px" :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramType')" @change="handleTypeChange(item)">
            <el-option
              v-for="types in BPM_HTTP_REQUEST_PARAM_TYPES"
              :key="types.value"
              :label="t(types.label)"
              :value="types.value"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.header.${index}.value`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamValue'),
            trigger: 'blur'
          }"
        >
          <el-input
            v-if="item.type === BpmHttpRequestParamTypeEnum.FIXED_VALUE"
            v-model="item.value"
            style="width: 200px"
            :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramValuePlaceholder')"
          />
        </el-form-item>
        <el-form-item
          :prop="`${bind}.header.${index}.value`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamValue'),
            trigger: 'change'
          }"
        >
          <el-select
            v-if="item.type === BpmHttpRequestParamTypeEnum.FROM_FORM"
            v-model="item.value"
            style="width: 200px"
            :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramValuePlaceholder')"
          >
            <el-option
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-1 flex items-center">
        <Icon icon="ep:delete" :size="18" :title="t('simpleProcessDesignerV2.httpRequestParamSetting.deleteRow')" @click="deleteHttpRequestParam(props.header, index)" />
      </div>
    </div>
    <el-button type="primary" text @click="addHttpRequestParam(props.header)">
      <Icon icon="ep:plus" class="mr-5px" />{{ t('simpleProcessDesignerV2.httpRequestParamSetting.addRow') }}
    </el-button>
  </el-form-item>
  <el-form-item label-position="top" :label="t('simpleProcessDesignerV2.httpRequestParamSetting.body')">
    <div class="flex pb-4" v-for="(item, index) in props.body" :key="index">
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.body.${index}.key`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamKey'),
            trigger: 'blur'
          }"
        >
          <el-input v-model="item.key" style="width: 160px" :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramKeyPlaceholder')" />
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-form-item>
          <el-select v-model="item.type" style="width: 160px" :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramType')" @change="handleTypeChange(item)">
            <el-option
              v-for="types in BPM_HTTP_REQUEST_PARAM_TYPES"
              :key="types.value"
              :label="t(types.label)"
              :value="types.value"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.body.${index}.value`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamValue'),
            trigger: 'blur'
          }"
        >
          <el-input
            v-if="item.type === BpmHttpRequestParamTypeEnum.FIXED_VALUE"
            v-model="item.value"
            style="width: 200px"
            :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramValuePlaceholder')"
          />
        </el-form-item>
        <el-form-item
          :prop="`${bind}.body.${index}.value`"
          :rules="{
            required: true,
            message: t('simpleProcessDesignerV2.httpRequestParamSetting.requiredParamValue'),
            trigger: 'change'
          }"
        >
          <el-select
            v-if="item.type === BpmHttpRequestParamTypeEnum.FROM_FORM"
            v-model="item.value"
            style="width: 200px"
            :placeholder="t('simpleProcessDesignerV2.httpRequestParamSetting.paramValuePlaceholder')"
          >
            <el-option
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-1 flex items-center">
        <Icon icon="ep:delete" :size="18" :title="t('simpleProcessDesignerV2.httpRequestParamSetting.deleteRow')" @click="deleteHttpRequestParam(props.body, index)" />
      </div>
    </div>
    <el-button type="primary" text @click="addHttpRequestParam(props.body)">
      <Icon icon="ep:plus" class="mr-5px" />{{ t('simpleProcessDesignerV2.httpRequestParamSetting.addRow') }}
    </el-button>
  </el-form-item>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  HttpRequestParam,
  BPM_HTTP_REQUEST_PARAM_TYPES,
  BpmHttpRequestParamTypeEnum
} from '../../consts'
import { useFormFieldsAndStartUser } from '../../node'

const { t } = useI18n()

defineOptions({
  name: 'HttpRequestParamSetting'
})

const props = defineProps({
  header: {
    type: Array as () => HttpRequestParam[],
    required: false,
    default: () => []
  },
  body: {
    type: Array as () => HttpRequestParam[],
    required: false,
    default: () => []
  },
  bind: {
    type: String,
    required: true
  }
})

// 流程表单字段，发起人字段
const formFieldOptions = useFormFieldsAndStartUser()

/** 监听类型变化，清空值 */
const handleTypeChange = (item: HttpRequestParam) => {
  // 当类型改变时，清空值
  item.value = ''
}

/** 添加请求配置项 */
const addHttpRequestParam = (arr: HttpRequestParam[]) => {
  arr.push({
    key: '',
    type: BpmHttpRequestParamTypeEnum.FIXED_VALUE,
    value: ''
  })
}

/** 删除请求配置项 */
const deleteHttpRequestParam = (arr: HttpRequestParam[], index: number) => {
  arr.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
