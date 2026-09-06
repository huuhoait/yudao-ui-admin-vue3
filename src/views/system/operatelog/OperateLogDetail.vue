<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" :title="t('system.operatelog.detail')" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('system.operatelog.logId')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo185')" v-if="detailData.traceId">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo186')">
        {{ detailData.userId }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo187')">
        {{ detailData.userName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo188')">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo189')">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo190')">
        {{ detailData.type }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo191')">
        {{ detailData.subType }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo192')">
        {{ detailData.action }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.extra" :label="t('system.operatelog._todo193')">
        {{ detailData.extra }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo194')">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo195')">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.operatelog._todo196')">
        {{ detailData.bizId }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as OperateLogApi from '@/api/system/operatelog'

defineOptions({ name: 'SystemOperateLogDetail' })

const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as OperateLogApi.OperateLogVO) // 详情数据

/** 打开弹窗 */
const open = async (data: OperateLogApi.OperateLogVO) => {
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
