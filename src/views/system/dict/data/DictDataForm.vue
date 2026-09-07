<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item :label="t('system.dict.data.dictType')" prop="type">
        <el-input
          v-model="formData.dictType"
          :disabled="typeof formData.id !== 'undefined'"
          :placeholder="t('system.dict.data.inputParameterName')"
        />
      </el-form-item>
      <el-form-item :label="t('system.dict.data.dataLabel')" prop="label">
        <el-input v-model="formData.label" :placeholder="t('system.dict.data.inputDataLabel')" />
      </el-form-item>
      <el-form-item :label="t('system.dict.data.dataValue')" prop="value">
        <el-input v-model="formData.value" :placeholder="t('system.dict.data.inputDataValue')" />
      </el-form-item>
      <el-form-item :label="t('system.dict.data.displaySort')" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
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
      <el-form-item :label="t('system.dict.data.colorType')" prop="colorType">
        <el-select v-model="formData.colorType">
          <el-option
            v-for="item in colorTypeOptions"
            :key="item.value"
            :label="item.label + '(' + item.value + ')'"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="CSS Class" prop="cssClass">
        <el-input v-model="formData.cssClass" :placeholder="t('system.dict.data.inputCssClass')" />
      </el-form-item>
      <el-form-item :label="t('system.dict.data.remark')" prop="remark">
        <el-input v-model="formData.remark" :placeholder="t('system.dict.data.inputContent')" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">{{ t('common.ok') }}</el-button>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as DictDataApi from '@/api/system/dict/dict.data'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'SystemDictDataForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<DictDataApi.DictDataVO>({
  id: undefined,
  sort: undefined,
  label: '',
  value: '',
  dictType: '',
  status: CommonStatusEnum.ENABLE,
  colorType: '',
  cssClass: '',
  remark: ''
})
const formRules = reactive({
  label: [{ required: true, message: t('system.dict.data.dataLabelRequired'), trigger: 'blur' }],
  value: [{ required: true, message: t('system.dict.data.dataValueRequired'), trigger: 'blur' }],
  sort: [{ required: true, message: t('system.dict.data.dataOrderRequired'), trigger: 'blur' }],
  status: [{ required: true, message: t('system.dict.data.statusRequired'), trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

// 数据标签回显样式
const colorTypeOptions = readonly([
  {
    value: 'default',
    label: t('system.dict.data.default')
  },
  {
    value: 'primary',
    label: t('system.dict.data.primary')
  },
  {
    value: 'success',
    label: t('system.dict.data.success')
  },
  {
    value: 'info',
    label: t('system.dict.data.info')
  },
  {
    value: 'warning',
    label: t('system.dict.data.warning')
  },
  {
    value: 'danger',
    label: t('system.dict.data.danger')
  }
])

/** 打开弹窗 */
const open = async (type: string, id?: number, dictType?: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (dictType) {
    formData.value.dictType = dictType
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DictDataApi.getDictData(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await DictDataApi.createDictData(data)
      message.success(t('common.createSuccess'))
    } else {
      await DictDataApi.updateDictData(data)
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
    sort: undefined,
    label: '',
    value: '',
    dictType: '',
    status: CommonStatusEnum.ENABLE,
    colorType: '',
    cssClass: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
