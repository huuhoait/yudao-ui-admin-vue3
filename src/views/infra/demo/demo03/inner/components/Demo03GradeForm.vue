<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    v-loading="formLoading"
  >
    <el-form-item :label="t('infra.demo.demo03.inner.components.name')" prop="name">
      <el-input v-model="formData.name" :placeholder="t('infra.demo.demo03.inner.components.inputName')" />
    </el-form-item>
    <el-form-item :label="t('infra.demo.demo03.inner.components._todo204')" prop="teacher">
      <el-input v-model="formData.teacher" :placeholder="t('infra.demo.demo03.inner.components._todo205')" />
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
import { Demo03StudentApi } from '@/api/infra/demo/demo03/inner'
const { t } = useI18n() // 国际化

const props = defineProps<{
  studentId?: number // 学生编号（主表的关联字段）
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref<any>({})
const formRules = reactive({
  studentId: [{ required: true, message: t('infra.demo.demo03.inner.components._todo202'), trigger: 'blur' }],
  name: [{ required: true, message: t('infra.demo.demo03.inner.components.nameRequired'), trigger: 'blur' }],
  teacher: [{ required: true, message: t('infra.demo.demo03.inner.components._todo206'), trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    // 1. 重置表单
    formData.value = {
      id: undefined,
      studentId: undefined,
      name: undefined,
      teacher: undefined
    }
    // 2. val 非空，则加载数据
    if (!val) {
      return
    }
    try {
      formLoading.value = true
      const data = await Demo03StudentApi.getDemo03GradeByStudentId(val)
      if (!data) {
        return
      }
      formData.value = data
    } finally {
      formLoading.value = false
    }
  },
  { immediate: true }
)

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 表单值 */
const getData = () => {
  return formData.value
}

defineExpose({ validate, getData })
</script>
