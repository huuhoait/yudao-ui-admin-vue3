<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <el-form-item :label="t('infra.fileConfig.configName')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('infra.fileConfig.inputConfigName')" />
      </el-form-item>
      <el-form-item :label="t('infra.fileConfig.remark')" prop="remark">
        <el-input v-model="formData.remark" :placeholder="t('infra.fileConfig.inputRemark')" />
      </el-form-item>
      <el-form-item :label="t('infra.fileConfig.storage')" prop="storage">
        <el-select
          v-model="formData.storage"
          :disabled="formData.id !== undefined"
          :placeholder="t('infra.fileConfig.selectStorage')"
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
        :label="t('infra.fileConfig.basePath')"
        prop="config.basePath"
      >
        <el-input v-model="formData.config.basePath" :placeholder="t('infra.fileConfig.inputBasePath')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig.hostAddress')"
        prop="config.host"
      >
        <el-input v-model="formData.config.host" :placeholder="t('infra.fileConfig.inputHostAddress')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig.hostPort')"
        prop="config.port"
      >
        <el-input-number v-model="formData.config.port" :min="0" :placeholder="t('infra.fileConfig.inputHostPort')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig.username')"
        prop="config.username"
      >
        <el-input v-model="formData.config.username" :placeholder="t('infra.fileConfig.inputPassword')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage >= 11 && formData.storage <= 12"
        :label="t('infra.fileConfig.password')"
        prop="config.password"
      >
        <el-input v-model="formData.config.password" :placeholder="t('infra.fileConfig.inputPassword')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 11" :label="t('infra.fileConfig.connectionMode')" prop="config.mode">
        <el-radio-group v-model="formData.config.mode">
          <el-radio key="Active" value="Active">{{ t('infra.fileConfig.activeMode') }}</el-radio>
          <el-radio key="Passive" value="Passive">{{ t('infra.fileConfig.passiveMode') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- S3 -->
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig.nodeAddress')" prop="config.endpoint">
        <el-input v-model="formData.config.endpoint" :placeholder="t('infra.fileConfig.inputNodeAddress')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig.storageBucket')" prop="config.bucket">
        <el-input v-model="formData.config.bucket" :placeholder="t('infra.fileConfig.inputBucket')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" label="accessKey" prop="config.accessKey">
        <el-input v-model="formData.config.accessKey" :placeholder="t('infra.fileConfig.inputAccesskey')" />
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" label="accessSecret" prop="config.accessSecret">
        <el-input v-model="formData.config.accessSecret" :placeholder="t('infra.fileConfig.inputAccesssecret')" />
      </el-form-item>
      <el-form-item
        v-if="formData.storage === 20"
        :label="t('infra.fileConfig.pathStyle')"
        prop="config.enablePathStyleAccess"
      >
        <el-radio-group v-model="formData.config.enablePathStyleAccess">
          <el-radio key="true" :value="true">{{ t('infra.fileConfig.enable') }}</el-radio>
          <el-radio key="false" :value="false">{{ t('infra.fileConfig.disabled') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.storage === 20"
        :label="t('infra.fileConfig.publicAccess')"
        prop="config.enablePublicAccess"
      >
        <el-radio-group v-model="formData.config.enablePublicAccess">
          <el-radio key="true" :value="true">{{ t('infra.fileConfig.public') }}</el-radio>
          <el-radio key="false" :value="false">{{ t('infra.fileConfig.private') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig.region')">
        <!-- 选填，无需参数校验 -->
        <el-input v-model="formData.config.region" :placeholder="t('infra.fileConfig._todo268')" />
      </el-form-item>
      <!-- 通用 -->
      <el-form-item v-if="formData.storage === 20" :label="t('infra.fileConfig.customDomain')">
        <!-- 无需参数校验，所以去掉 prop -->
        <el-input v-model="formData.config.domain" :placeholder="t('infra.fileConfig.inputCustomDomain')" />
      </el-form-item>
      <el-form-item v-else-if="formData.storage" :label="t('infra.fileConfig.customDomain')" prop="config.domain">
        <el-input v-model="formData.config.domain" :placeholder="t('infra.fileConfig.inputCustomDomain')" />
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
  name: [{ required: true, message: t('infra.fileConfig.configNameCannotBeEmpty'), trigger: 'blur' }],
  storage: [{ required: true, message: t('infra.fileConfig.storageCannotBeEmpty'), trigger: 'change' }],
  config: {
    basePath: [{ required: true, message: t('infra.fileConfig.basePathCannotBeEmpty'), trigger: 'blur' }],
    host: [{ required: true, message: t('infra.fileConfig.hostAddressCannotBeEmpty'), trigger: 'blur' }],
    port: [{ required: true, message: t('infra.fileConfig.hostPortCannotBeEmpty'), trigger: 'blur' }],
    username: [{ required: true, message: t('infra.fileConfig.usernameRequired'), trigger: 'blur' }],
    password: [{ required: true, message: t('infra.fileConfig.passwordRequired'), trigger: 'blur' }],
    mode: [{ required: true, message: t('infra.fileConfig.connectionModeCannotBeEmpty'), trigger: 'change' }],
    endpoint: [{ required: true, message: t('infra.fileConfig.nodeAddressCannotBeEmpty'), trigger: 'blur' }],
    bucket: [{ required: true, message: t('infra.fileConfig.storageBucketCannotBeEmpty'), trigger: 'blur' }],
    accessKey: [{ required: true, message: t('infra.fileConfig.accesskeyCannotBeEmpty'), trigger: 'blur' }],
    accessSecret: [{ required: true, message: t('infra.fileConfig.accesssecretCannotBeEmpty'), trigger: 'blur' }],
    enablePathStyleAccess: [
      { required: true, message: t('infra.fileConfig._todo287'), trigger: 'change' }
    ],
    enablePublicAccess: [{ required: true, message: t('infra.fileConfig._todo288'), trigger: 'change' }],
    domain: [{ required: true, message: t('infra.fileConfig.customDomainCannotBeEmpty'), trigger: 'blur' }]
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
