<template>
  <Dialog v-model="dialogVisible" :title="t('infra.job._todo294')" width="700px">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('infra.job.taskId')" min-width="60">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job.taskName')">
        {{ detailData.name }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo295')">
        <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo296')">
        {{ detailData.handlerName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo297')">
        {{ detailData.handlerParam }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo298')">
        {{ detailData.cronExpression }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo299')">
        {{ detailData.retryCount }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo300')">
        {{ detailData.retryInterval }} {{ t('common.milliseconds') }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo301')">
        {{
          detailData.monitorTimeout > 0
            ? detailData.monitorTimeout + ' ' + t('common.milliseconds')
            : t('infra.job.notEnabled')
        }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('infra.job._todo302')">
        <el-timeline>
          <el-timeline-item
            v-for="(nextTime, index) in nextTimes"
            :key="index"
            :timestamp="formatDate(nextTime)"
          >
            {{ t('infra.job.nthTime', { n: index + 1 }) }}
          </el-timeline-item>
        </el-timeline>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as JobApi from '@/api/infra/job'

defineOptions({ name: 'InfraJobDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as JobApi.JobVO) // 详情数据
const nextTimes = ref([]) // 下一轮执行时间的数组

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 查看，设置数据
  if (id) {
    detailLoading.value = true
    try {
      detailData.value = await JobApi.getJob(id)
      // 获取下一次执行时间
      nextTimes.value = await JobApi.getJobNextTimes(id)
    } finally {
      detailLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
