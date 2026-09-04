<template>
  <el-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <el-form-item :label="t('bpm.model.form._todo107')" prop="formType" class="mb-20px">
      <el-radio-group v-model="modelData.formType">
        <el-radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
          :key="dict.value"
          :value="dict.value"
        >
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="modelData.formType === BpmModelFormType.NORMAL"
      :label="t('bpm.model.form._todo108')"
      prop="formId"
    >
      <el-select v-model="modelData.formId" clearable style="width: 100%">
        <el-option v-for="form in formList" :key="form.id" :label="form.name" :value="form.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="modelData.formType === BpmModelFormType.CUSTOM"
      :label="t('bpm.model.form.formSubmitRoute')"
      prop="formCustomCreatePath"
    >
      <el-input
        v-model="modelData.formCustomCreatePath"
        :placeholder="t('bpm.model.form.inputFormSubmitRoute')"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        :content="t('bpm.model.form._todo109')"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
    <el-form-item
      v-if="modelData.formType === BpmModelFormType.CUSTOM"
      :label="t('bpm.model.form._todo110')"
      prop="formCustomViewPath"
    >
      <el-input
        v-model="modelData.formCustomViewPath"
        :placeholder="t('bpm.model.form._todo111')"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        :content="t('bpm.model.form._todo112')"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
    <!-- 表单预览 -->
    <div
      v-if="
        modelData.formType === BpmModelFormType.NORMAL &&
        modelData.formId &&
        formPreview.rule.length > 0
      "
      class="mt-20px"
    >
      <div class="flex items-center mb-15px">
        <div class="h-15px w-4px bg-[#1890ff] mr-10px"></div>
        <span class="text-15px font-bold">{{ t('bpm.model.form._todo113') }}</span>
      </div>
      <form-create
        v-model="formPreview.formData"
        :rule="formPreview.rule"
        :option="formPreview.option"
      />
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelFormType } from '@/utils/constants'
import type { Rule } from '@form-create/element-ui'
const { t } = useI18n() // 国际化

defineProps<{
  formList: FormApi.FormVO[]
}>()

const formRef = ref()

// 创建本地数据副本
const modelData = defineModel<any>()

// 表单预览数据
const formPreview = ref({
  formData: {},
  rule: [] as Rule[],
  option: {
    submitBtn: false,
    resetBtn: false,
    formData: {}
  }
})

// 监听表单ID变化，加载表单数据
watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL) {
      const data = await FormApi.getForm(newFormId)
      setConfAndFields2(formPreview.value, data.conf, data.fields)
      // 设置只读
      formPreview.value.rule.forEach((item) => {
        item.props = { ...item.props, disabled: true }
      })
    } else {
      formPreview.value.rule = []
    }
  },
  { immediate: true }
)

const rules = {
  formType: [{ required: true, message: t('bpm.model.form._todo114'), trigger: 'blur' }],
  formId: [{ required: true, message: t('bpm.model.form._todo115'), trigger: 'blur' }],
  formCustomCreatePath: [{ required: true, message: t('bpm.model.form.formSubmitRouteRequired'), trigger: 'blur' }],
  formCustomViewPath: [{ required: true, message: t('bpm.model.form._todo116'), trigger: 'blur' }]
}

/** 表单校验 */
const validate = async () => {
  await formRef.value?.validate()
}

defineExpose({
  validate
})
</script>
