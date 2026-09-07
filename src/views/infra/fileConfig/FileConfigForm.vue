<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <el-form-item :label="t('infra.fileConfig._todo246')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('infra.fileConfig._todo247')" />
      </el-form-item>
      <el-form-item :label="t('infra.fileConfig.remark')" prop="remark">
        <el-input v-model="formData.remark" :placeholder="t('infra.fileConfig.inputRemark')" />
      </el-form-item>
      <el-form-item :label="t('infra.fileConfig._todo248')" prop="storage">
        <el-select
          v-model="formData.storage"
          :disabled="formData.id !== undefined"
          :placeholder="t('infra.fileConfig._todo249')"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.INFRA_FILE_STORAGE)"
            :key="dict.value"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <!-- DB -->
      <!-- Local / FTP / SFTP -->
      <el-form-item
        v-if="formData.storage >= 10 && formData.storage <= 12"
        :label="t('infra.fileConfig._todo250')"
        prop="config.basePath"
      >
        <el-input v-model="formData.config.basePath" :placeholder="t('infra.fileConfig._todo251')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig._todo252')"
        prop="config.host"
      >
        <el-input v-model="formData.config.host" :placeholder="t('infra.fileConfig._todo253')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig._todo254')"
        prop="config.port"
      >
        <el-input-number v-model="formData.config.port" :min="0" :placeholder="t('infra.fileConfig._todo255')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig.username')"
        prop="config.username"
      >
        <el-input v-model="formData.config.username" :placeholder="t('infra.fileConfig._todo256')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig._todo257')"
        prop="config.password"
      >
        <el-input v-model="formData.config.password" :placeholder="t('infra.fileConfig._todo256')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 11" :label="t('infra.fileConfig._todo258')" prop="config.mode">
        <el-radio-group v-model="formData.config.mode">
          <el-radio key="Active" value="Active">{{ t('infra.fileConfig._todo271') }}</el-radio>
          <el-radio key="Passive" value="Passive">{{ t('infra.fileConfig._todo272') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- S3 -->
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig._todo259')" prop="config.endpoint">
        <el-input v-model="formData.config.endpoint" :placeholder="t('infra.fileConfig._todo260')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig._todo261')" prop="config.bucket">
        <el-input v-model="formData.config.bucket" :placeholder="t('infra.fileConfig._todo262')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" label="accessKey" prop="config.accessKey">
        <el-input v-model="formData.config.accessKey" :placeholder="t('infra.fileConfig._todo263')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" label="accessSecret" prop="config.accessSecret">
        <el-input v-model="formData.config.accessSecret" :placeholder="t('infra.fileConfig._todo264')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage === 20"
        :label="t('infra.fileConfig._todo265')"
        prop="config.enablePathStyleAccess"
      >
        <el-radio-group v-model="formData.config.enablePathStyleAccess">
          <el-radio key="true" :value="true">{{ t('infra.fileConfig.enable') }}</el-radio>
          <el-radio key="false" :value="false">{{ t('infra.fileConfig._todo273') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.storage === 20"
        :label="t('infra.fileConfig._todo266')"
        prop="config.enablePublicAccess"
      >
        <el-radio-group v-model="formData.config.enablePublicAccess">
          <el-radio key="true" :value="true">{{ t('infra.fileConfig._todo274') }}</el-radio>
          <el-radio key="false" :value="false">{{ t('infra.fileConfig._todo275') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig._todo267')">
        <!-- 选填，无需参数校验 -->
        <el-input v-model="formData.config.region" :placeholder="t('infra.fileConfig._todo268')" />
      </el-form-item>
      <!-- 通用 -->
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig._todo269')">
        <!-- 无需参数校验，所以去掉 prop -->
        <el-input v-model="formData.config.domain" :placeholder="t('infra.fileConfig._todo270')" />
      </el-form-item>
      <el-form-item v-else-if="formData.storage" :label="t('infra.fileConfig._todo269')" prop="config.domain">
        <el-input v-model="formData.config.domain" :placeholder="t('infra.fileConfig._todo270')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">{{ t('common.ok') }}</el-button>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as FileConfigApi from '@/api/infra/fileConfig'
import { FormRules } from 'element-plus'

defineOptions({ name: 'InfraFileConfigForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  storage: 0,
  remark: '',
  config: {} as FileConfigApi.FileClientConfig
})
const formRules = reactive<FormRules>({
  name: [{ required: true, message: t('infra.fileConfig._todo276'), trigger: 'blur' }],
  storage: [{ required: true, message: t('infra.fileConfig._todo277'), trigger: 'change' }],
  config: {
    basePath: [{ required: true, message: t('infra.fileConfig._todo278'), trigger: 'blur' }],
    host: [{ required: true, message: t('infra.fileConfig._todo279'), trigger: 'blur' }],
    port: [{ required: true, message: t('infra.fileConfig._todo280'), trigger: 'blur' }],
    username: [{ required: true, message: t('infra.fileConfig.usernameRequired'), trigger: 'blur' }],
    password: [{ required: true, message: t('infra.fileConfig._todo281'), trigger: 'blur' }],
    mode: [{ required: true, message: t('infra.fileConfig._todo282'), trigger: 'change' }],
    endpoint: [{ required: true, message: t('infra.fileConfig._todo283'), trigger: 'blur' }],
    bucket: [{ required: true, message: t('infra.fileConfig._todo284'), trigger: 'blur' }],
    accessKey: [{ required: true, message: t('infra.fileConfig._todo285'), trigger: 'blur' }],
    accessSecret: [{ required: true, message: t('infra.fileConfig._todo286'), trigger: 'blur' }],
    enablePathStyleAccess: [
      { required: true, message: t('infra.fileConfig._todo287'), trigger: 'change' }
    ],
    enablePublicAccess: [{ required: true, message: t('infra.fileConfig._todo288'), trigger: 'change' }],
    domain: [{ required: true, message: t('infra.fileConfig._todo289'), trigger: 'blur' }]
  } as FormRules
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
      formData.value = await FileConfigApi.getFileConfig(id)
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
    const data = formData.value as unknown as FileConfigApi.FileConfigVO
    if (formType.value === 'create') {
      await FileConfigApi.createFileConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await FileConfigApi.updateFileConfig(data)
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
    name: '',
    storage: undefined!,
    remark: '',
    config: {} as FileConfigApi.FileClientConfig
  }
  formRef.value?.resetFields()
}
</script>
