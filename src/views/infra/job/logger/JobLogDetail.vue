<template>
  <Dialog v-model="dialogVisible" :title="t('infra.job.logger._todo325')" width="700px">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('infra.job.logger._todo326')" min-width="60">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger.taskId')">
        {{ detailData.jobId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo327')">
        {{ detailData.handlerName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo328')">
        {{ detailData.handlerParam }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo329')">
        {{ detailData.executeIndex }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo330')">
        {{ formatDate(detailData.beginTime) + ' ~ ' + formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo331')">
        {{ detailData.duration }} {{ t('common.milliseconds') }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo332')">
        <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.logger._todo333')">
        {{ detailData.result }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as JobLogApi from '@/api/infra/jobLog'

defineOptions({ name: 'JobLogDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as JobLogApi.JobLogVO) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 查看，设置数据
  if (id) {
    detailLoading.value = true
    try {
      detailData.value = await JobLogApi.getJobLog(id)
    } finally {
      detailLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
