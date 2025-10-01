<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.basicForm.tableName')" prop="tableName">
          <el-input
            v-model="formData.tableName"
            :placeholder="t('infra.codegen.basicForm.tableNamePlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.basicForm.tableComment')" prop="tableComment">
          <el-input
            v-model="formData.tableComment"
            :placeholder="t('infra.codegen.basicForm.tableCommentPlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <span>
              {{ t('infra.codegen.basicForm.className') }}
              <el-tooltip :content="t('infra.codegen.basicForm.classNameTooltip')" placement="top">
                <Icon class="" icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input
            v-model="formData.className"
            :placeholder="t('infra.codegen.basicForm.classNamePlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.basicForm.author')" prop="author">
          <el-input
            v-model="formData.author"
            :placeholder="t('infra.codegen.basicForm.authorPlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :label="t('infra.codegen.basicForm.remark')" prop="remark">
          <el-input
            v-model="formData.remark"
            :placeholder="t('infra.codegen.basicForm.remarkPlaceholder')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import * as CodegenApi from '@/api/infra/codegen'
import { PropType } from 'vue'

defineOptions({ name: 'InfraCodegenBasicInfoForm' })

const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableVO>>,
    default: () => null
  }
})

const { t } = useI18n()
const formRef = ref()
const formData = ref({
  tableName: '',
  tableComment: '',
  className: '',
  author: '',
  remark: ''
})
const rules = reactive({
  tableName: [
    {
      required: true,
      message: t('infra.codegen.basicForm.rules.tableNameRequired'),
      trigger: 'blur'
    }
  ],
  tableComment: [
    {
      required: true,
      message: t('infra.codegen.basicForm.rules.tableCommentRequired'),
      trigger: 'blur'
    }
  ],
  className: [
    {
      required: true,
      message: t('infra.codegen.basicForm.rules.classNameRequired'),
      trigger: 'blur'
    }
  ],
  author: [
    {
      required: true,
      message: t('infra.codegen.basicForm.rules.authorRequired'),
      trigger: 'blur'
    }
  ]
})

/** 监听 table 属性，复制给 formData 属性 */
watch(
  () => props.table,
  (table) => {
    if (!table) return
    formData.value = table
  },
  {
    deep: true,
    immediate: true
  }
)

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
