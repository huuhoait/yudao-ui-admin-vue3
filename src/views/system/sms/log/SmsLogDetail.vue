<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" :title="t('system.sms.log.detail')" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('system.sms.log.logId')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log.smsChannel')">
        {{ channelList.find((channel) => channel.id === detailData.channelId)?.signature }}
        <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="detailData.channelCode" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo243')">
        {{ detailData.templateId }} | {{ detailData.templateCode }}
        <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="detailData.templateType!" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo244')">
        {{ detailData.apiTemplateId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo245')">
        {{ detailData.mobile }}
        <span v-if="detailData.userType && detailData.userId">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="detailData.userType" />
          ({{ detailData.userId }})
        </span>
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo246')">
        {{ detailData.templateContent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo247')">
        {{ detailData.templateParams }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('common.createTime')">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log.sendStatus')">
        <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="detailData.sendStatus!" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log.sendTime')">
        {{ formatDate(detailData.sendTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo248')">
        {{ detailData.apiSendCode }} | {{ detailData.apiSendMsg }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo249')">
        {{ detailData.apiSerialNo }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo250')">
        {{ detailData.apiRequestId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo251')">
        <dict-tag :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS" :value="detailData.receiveStatus!" />
        {{ formatDate(detailData.receiveTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.sms.log._todo252')">
        {{ detailData.apiReceiveCode }} | {{ detailData.apiReceiveMsg }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as SmsLogApi from '@/api/system/sms/smsLog'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'

defineOptions({ name: 'SystemSmsLogDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref<SmsLogApi.SmsLogVO>({} as SmsLogApi.SmsLogVO) // 详情数据
const channelList = ref<SmsChannelApi.SmsChannelVO[]>([]) // 短信渠道列表

/** 打开弹窗 */
const open = async (data: SmsLogApi.SmsLogVO) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
  // 加载渠道列表
  channelList.value = await SmsChannelApi.getSimpleSmsChannelList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
