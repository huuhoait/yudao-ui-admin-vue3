<template>
  <Dialog
    v-model="dialogVisible"
    :max-height="500"
    :scroll="true"
    :title="t('sys.notify.message.detail')"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('sys.notify.message.id')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.userType')">
        <dict-tag :type="DICT_TYPE.USER_TYPE" :value="detailData.userType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.userId')">
        {{ detailData.userId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateId')">
        {{ detailData.templateId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateCode')">
        {{ detailData.templateCode }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateNickname')">
        {{ detailData.templateNickname }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateContent')">
        {{ detailData.templateContent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateParams')">
        {{ detailData.templateParams }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.templateType')">
        <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="detailData.templateType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.readStatus')">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detailData.readStatus" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.readTime')">
        {{ formatDate(detailData.readTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('sys.notify.message.createTime')">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'

defineOptions({ name: 'SystemNotifyMessageDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as NotifyMessageApi.NotifyMessageVO) // 详情数据

/** 打开弹窗 */
const open = async (data: NotifyMessageApi.NotifyMessageVO) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
