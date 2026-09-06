<template>
  <Dialog v-model="dialogVisible" :title="t('system.loginlog.detail')" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="t('system.loginlog._todo39')" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog._todo40')">
        <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_TYPE" :value="detailData.logType" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog.username')">
        {{ detailData.username }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog.loginAddress')">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog._todo41')">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog._todo42')">
        <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_RESULT" :value="detailData.result" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('system.loginlog._todo43')">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as LoginLogApi from '@/api/system/loginLog'

defineOptions({ name: 'SystemLoginLogDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as LoginLogApi.LoginLogVO) // 详情数据

/** 打开弹窗 */
const open = async (data: LoginLogApi.LoginLogVO) => {
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
