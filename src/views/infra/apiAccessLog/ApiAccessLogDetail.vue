<template>
  <Dialog
    v-model="dialogVisible"
    :max-height="500"
    :scroll="true"
    :title="t('infra.apiAccessLog.detail.title')"
    width="800"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.id')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.traceId')">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.applicationName')">
        {{ detailData.applicationName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.userInfo')">
        {{ detailData.userId }}
        <dict-tag :type="DICT_TYPE.USER_TYPE" :value="detailData.userType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.userIp')">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.userAgent')">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.requestInfo')">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.requestParams')">
        {{ detailData.requestParams }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.responseBody')">
        {{ detailData.responseBody }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.requestTime')">
        {{ formatDate(detailData.beginTime) }} ~ {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.requestDuration')">
        {{ t('infra.apiAccessLog.detail.durationValue', { value: detailData.duration }) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.result')">
        <div v-if="detailData.resultCode === 0">{{ t('infra.apiAccessLog.detail.resultSuccess') }}</div>
        <div v-else-if="detailData.resultCode > 0">
          {{
            t('infra.apiAccessLog.detail.resultFail', {
              code: detailData.resultCode,
              msg: detailData.resultMsg
            })
          }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.operateModule')">
        {{ detailData.operateModule }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.operateName')">
        {{ detailData.operateName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.apiAccessLog.detail.operateType')">
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
