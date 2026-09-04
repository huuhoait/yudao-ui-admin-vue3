<template>
  <doc-alert :title="t('bpm.task.manager._todo270')" url="https://doc.iocoder.cn/bpm/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item :label="t('bpm.task.manager.taskName')" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          :placeholder="t('bpm.task.manager.inputTaskName')"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item :label="t('common.createTime')" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          :end-placeholder="t('bpm.task.manager.endDate')"
          :start-placeholder="t('bpm.task.manager.startDate')"
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
      <el-table-column align="center" :label="t('bpm.task.manager.process')" prop="processInstance.name" width="180" />
      <el-table-column
        align="center"
        :label="t('bpm.task.manager.starter')"
        prop="processInstance.startUser.nickname"
        width="100"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="t('bpm.task.manager.startTime')"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" :label="t('bpm.task.manager.currentTask')" prop="name" width="180" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="t('bpm.task.manager._todo271')"
        prop="createTime"
        width="180"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="t('bpm.task.manager._todo272')"
        prop="endTime"
        width="180"
      />
      <el-table-column align="center" :label="t('bpm.task.manager._todo273')" prop="assigneeUser.nickname" width="100" />
      <el-table-column align="center" :label="t('bpm.task.manager.approveStatus')" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" :label="t('bpm.task.manager.approveSuggestion')" prop="reason" min-width="180" />
      <el-table-column align="center" :label="t('bpm.task.manager._todo274')" min-width="180">
        <template #default="scope">
          <TaskEvidenceCell
            :attachments="scope.row.attachments"
            :sign-pic-url="scope.row.signPicUrl"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" :label="t('bpm.task.manager.duration')" prop="durationInMillis" width="160">
        <template #default="scope">
          {{ formatPast2(scope.row.durationInMillis) }}
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        :label="t('bpm.task.manager.processId')"
        prop="processInstanceId"
        :show-overflow-tooltip="true"
      />
      <el-table-column align="center" :label="t('bpm.task.manager.taskId')" prop="id" :show-overflow-tooltip="true" />
      <el-table-column align="center" :label="t('bpm.task.manager.action')" fixed="right" width="80">
        <template #default="scope">
          <el-button link type="primary" @click="handleAudit(scope.row)">{{ t('bpm.task.manager.history') }}</el-button>
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
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import * as TaskApi from '@/api/bpm/task'
import TaskEvidenceCell from '@/views/bpm/task/components/TaskEvidenceCell.vue'

// 它和【待办任务】【已办任务】的差异是，该菜单可以看全部的流程任务
defineOptions({ name: 'BpmManagerTask' })

const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TaskApi.getTaskManagerPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
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

/** 处理审批按钮 */
const handleAudit = (row: any) => {
  push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstance.id
    }
  })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
