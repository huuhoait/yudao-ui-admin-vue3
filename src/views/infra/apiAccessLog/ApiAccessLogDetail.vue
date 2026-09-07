<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" :title="t('infra.apiAccessLog.detail')" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('infra.apiAccessLog.logId')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.trace')">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.appName')">
        {{ detailData.applicationName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.userInfo')">
        {{ detailData.userId }}
        <dict-tag :type="DICT_TYPE.USER_TYPE" :value="detailData.userType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.userIp')">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.userAgent')">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.requestInfo')">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.requestParameters')">
        {{ detailData.requestParams }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.requestResult')">
        {{ detailData.responseBody }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.requestTime')">
        {{ formatDate(detailData.beginTime) }} ~ {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.requestDuration')">{{ detailData.duration }} ms</el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.operationResult')">
        <div v-if="detailData.resultCode === 0">{{ t('infra.apiAccessLog.normal') }}</div>
        <div v-else-if="detailData.resultCode > 0">
          {{ t('common.fail') }} | {{ detailData.resultCode }} | {{ detailData.resultMsg }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.operationModule')">
        {{ detailData.operateModule }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.operationName')">
        {{ detailData.operateName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.operationName')">
        <dict-tag :type="DICT_TYPE.INFRA_OPERATE_TYPE" :value="detailData.operateType" />
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as ApiAccessLog from '@/api/infra/apiAccessLog'

defineOptions({ name: 'ApiAccessLogDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单地加载中
const detailData = ref({} as ApiAccessLog.ApiAccessLogVO) // 详情数据

/** 打开弹窗 */
const open = async (data: ApiAccessLog.ApiAccessLogVO) => {
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
