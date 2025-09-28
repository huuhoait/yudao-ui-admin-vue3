<template>
  <doc-alert :title="$t('bpm.task.todo.docs.approve')" url="https://doc.iocoder.cn/bpm/task-todo-done/" />
  <doc-alert :title="$t('bpm.task.todo.docs.sign')" url="https://doc.iocoder.cn/bpm/sign/" />
  <doc-alert
    :title="$t('bpm.task.todo.docs.delegate')"
    url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
  />
  <doc-alert :title="$t('bpm.task.todo.docs.sign')" url="https://doc.iocoder.cn/bpm/sign/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          :placeholder="$t('bpm.task.todo.form.namePlaceholder')"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          {{ $t('common.query') }}
        </el-button>
      </el-form-item>
      <el-form-item label="" prop="category" class="absolute right-130px">
        <el-select
          v-model="queryParams.category"
          :placeholder="$t('bpm.task.todo.form.categoryPlaceholder')"
          clearable
          class="!w-155px"
          @change="handleQuery"
        >
          <el-option
            v-for="category in categoryList"
            :key="category.code"
            :label="category.name"
            :value="category.code"
          />
        </el-select>
      </el-form-item>
      <!-- 高级筛选 -->
      <el-form-item class="absolute right-0">
        <el-popover
          :visible="showPopover"
          persistent
          :width="400"
          :show-arrow="false"
          placement="bottom-end"
        >
          <template #reference>
            <el-button @click="showPopover = !showPopover">
              <Icon icon="ep:plus" class="mr-5px" />{{ $t('bpm.task.todo.advancedFilter.open') }}
            </el-button>
          </template>
          <el-form-item
            :label="$t('bpm.task.todo.advancedFilter.processLabel')"
            class="font-bold"
            label-position="top"
            prop="processDefinitionKey"
          >
            <el-select
              v-model="queryParams.processDefinitionKey"
              :placeholder="$t('bpm.task.todo.advancedFilter.processPlaceholder')"
              clearable
              @change="handleQuery"
              class="!w-390px"
            >
              <el-option
                v-for="item in processDefinitionList"
                :key="item.key"
                :label="item.name"
                :value="item.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            :label="$t('bpm.task.todo.advancedFilter.createTime')"
            class="font-bold"
            label-position="top"
            prop="createTime"
          >
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              :start-placeholder="$t('bpm.task.todo.advancedFilter.startDatePlaceholder')"
              :end-placeholder="$t('bpm.task.todo.advancedFilter.endDatePlaceholder')"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
              class="w-240px!"
            />
          </el-form-item>
          <el-form-item class="font-bold" label-position="top">
            <div class="flex justify-end w-full">
              <el-button @click="resetQuery">{{ $t('bpm.task.todo.advancedFilter.clear') }}</el-button>
              <el-button @click="showPopover = false">{{ $t('common.cancel') }}</el-button>
              <el-button type="primary" @click="handleQuery">{{ $t('common.confirm') }}</el-button>
            </div>
          </el-form-item>
        </el-popover>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        align="center"
        :label="$t('bpm.task.todo.table.process')"
        prop="processInstance.name"
        width="180"
      />
      <el-table-column :label="$t('bpm.task.todo.table.summary')" prop="processInstance.summary" width="180">
        <template #default="scope">
          <div
            class="flex flex-col"
            v-if="scope.row.processInstance.summary && scope.row.processInstance.summary.length > 0"
          >
            <div v-for="(item, index) in scope.row.processInstance.summary" :key="index">
              <el-text type="info"> {{ item.key }} : {{ item.value }} </el-text>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        :label="$t('bpm.task.todo.table.startUser')"
        prop="processInstance.startUser.nickname"
        width="100"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="$t('bpm.task.todo.table.startTime')"
        prop="processInstance.createTime"
        width="180"
      />
      <el-table-column align="center" :label="$t('bpm.task.todo.table.currentTask')" prop="name" width="180" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        :label="$t('bpm.task.todo.table.taskTime')"
        prop="createTime"
        width="180"
      />
      <el-table-column
        align="center"
        :label="$t('bpm.task.todo.table.processId')"
        prop="processInstanceId"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        align="center"
        :label="$t('bpm.task.todo.table.taskId')"
        prop="id"
        :show-overflow-tooltip="true"
      />
      <el-table-column align="center" :label="$t('common.operation')" fixed="right" width="80">
        <template #default="scope">
          <el-button link type="primary" @click="handleAudit(scope.row)">
            {{ $t('bpm.task.todo.table.handle') }}
          </el-button>
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
import * as TaskApi from '@/api/bpm/task'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import * as DefinitionApi from '@/api/bpm/definition'

defineOptions({ name: 'BpmTodoTask' })

const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const processDefinitionList = ref<any[]>([]) // 流程定义列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  category: undefined,
  processDefinitionKey: '',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const categoryList = ref<CategoryVO[]>([]) // 流程分类列表
const showPopover = ref(false) // 高级筛选是否展示

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TaskApi.getTaskTodoPage(queryParams)
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
      id: row.processInstance.id,
      taskId: row.id
    }
  })
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 获取流程定义列表
  processDefinitionList.value = await DefinitionApi.getSimpleProcessDefinitionList()
})
</script>
