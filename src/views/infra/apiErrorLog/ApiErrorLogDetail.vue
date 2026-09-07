<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" :title="t('infra.apiErrorLog.detail')" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('infra.apiErrorLog.logId')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.trace')">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.appName')">
        {{ detailData.applicationName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.userId')">
        {{ detailData.userId }}
        <dict-tag :type="DICT_TYPE.USER_TYPE" :value="detailData.userType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.userIp')">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.userAgent')">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.requestInfo')">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.requestParameters')">
        {{ detailData.requestParams }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.exceptionTime')">
        {{ formatDate(detailData.exceptionTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.exceptionName')">
        {{ detailData.exceptionName }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.exceptionStackTrace" :label="t('infra.apiErrorLog.exceptionStackTrace')">
        <el-input
          v-model="detailData.exceptionStackTrace"
          :autosize="{ maxRows: 20 }"
          :readonly="true"
          type="textarea"
        />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiErrorLog.processingStatus')">
        <dict-tag
          :type="DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS"
          :value="detailData.processStatus"
        />
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.processUserId" :label="t('infra.apiErrorLog.handler')">
        {{ detailData.processUserId }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.processTime" :label="t('infra.apiErrorLog.processingTime')">
        {{ formatDate(detailData.processTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as ApiErrorLog from '@/api/infra/apiErrorLog'

defineOptions({ name: 'ApiErrorLogDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as ApiErrorLog.ApiErrorLogVO) // 详情数据

/** 打开弹窗 */
const open = async (data: ApiErrorLog.ApiErrorLogVO) => {
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
