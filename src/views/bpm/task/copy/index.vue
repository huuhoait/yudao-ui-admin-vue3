<!-- 工作流 - 抄送我的流程 -->
<template>
  <doc-alert
    :title="t('bpm.task.copy._todo258')"
    url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
  />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form ref="queryFormRef" :inline="true" class="-mb-15px" label-width="68px">
      <el-form-item :label="t('bpm.task.copy.processName')" prop="name">
        <el-input
          v-model="queryParams.processInstanceName"
          @keyup.enter="handleQuery"
          class="!w-240px"
          clearable
          :placeholder="t('bpm.task.copy.inputProcessName')"
        />
      </el-form-item>
      <el-form-item :label="t('bpm.task.copy._todo259')" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          :end-placeholder="t('bpm.task.copy.endDate')"
          :start-placeholder="t('bpm.task.copy.startDate')"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          {{ t('common.query') }}
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          {{ t('common.reset') }}
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <!-- TODO 芋艿：增加摘要 -->
      <el-table-column align="center" :label="t('bpm.task.copy._todo260')" prop="processInstanceName" min-width="180" />
      <el-table-column :label="t('bpm.task.copy.summary')" prop="summary" min-width="180">
        <template #default="scope">
          <div class="flex flex-col" v-if="scope.row.summary && scope.row.summary.length > 0">
            <div v-for="(item, index) in scope.row.summary" :key="index">
              <el-text type="info"> {{ item.key }} : {{ item.value }} </el-text>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        :label="t('bpm.task.copy.processStarter')"
        prop="startUser.nickname"
        min-width="100"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="t('bpm.task.copy._todo261')"
        prop="processInstanceStartTime"
        width="180"
      />
      <el-table-column align="center" :label="t('bpm.task.copy._todo262')" prop="activityName" min-width="180" />
      <el-table-column align="center" :label="t('bpm.task.copy.ccUser')" min-width="100">
        <template #default="scope"> {{ scope.row.createUser?.nickname || '系统' }} </template>
      </el-table-column>
      <el-table-column align="center" :label="t('bpm.task.copy.ccOpinion')" prop="reason" width="150" />
      <el-table-column
        align="center"
        :label="t('bpm.task.copy._todo259')"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column align="center" :label="t('bpm.task.copy.action')" fixed="right" width="80">
        <template #default="scope">
          <el-button link type="primary" @click="handleAudit(scope.row)">{{ t('bpm.task.copy.detail') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmProcessInstanceCopy' })

const { push } = useRouter() // 路由

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  processInstanceId: '',
  processInstanceName: '',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProcessInstanceApi.getProcessInstanceCopyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 处理审批按钮 */
const handleAudit = (row: any) => {
  const query = {
    id: row.processInstanceId,
    activityId: undefined
  }
  if (row.activityId) {
    query.activityId = row.activityId
  }
  push({
    name: 'BpmProcessInstanceDetail',
    query: query
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
