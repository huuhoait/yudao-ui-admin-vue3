<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item :label="t('infra.demo.demo03.erp.components.name')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('infra.demo.demo03.erp.components.inputName')" />
      </el-form-item>
      <el-form-item :label="t('infra.demo.demo03.erp.components.score')" prop="score">
        <el-input v-model="formData.score" :placeholder="t('infra.demo.demo03.erp.components.inputScore')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">{{ t('common.ok') }}</el-button>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { Demo03StudentApi, Demo03Course } from '@/api/infra/demo/demo03/erp'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<Demo03Course>({
  id: undefined,
  studentId: undefined,
  name: undefined,
  score: undefined
})
const formRules = reactive({
  studentId: [{ required: true, message: t('infra.demo.demo03.erp.components.studentIdCannotBeEmpty'), trigger: 'blur' }],
  name: [{ required: true, message: t('infra.demo.demo03.erp.components.nameRequired'), trigger: 'blur' }],
  score: [{ required: true, message: t('infra.demo.demo03.erp.components.scoreCannotBeEmpty'), trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number, studentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.studentId = studentId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await Demo03StudentApi.getDemo03Course(id)
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
    const data = formData.value
    if (formType.value === 'create') {
      await Demo03StudentApi.createDemo03Course(data)
      message.success(t('common.createSuccess'))
    } else {
      await Demo03StudentApi.updateDemo03Course(data)
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
    studentId: undefined,
    name: undefined,
    score: undefined
  }
  formRef.value?.resetFields()
}
</script>
