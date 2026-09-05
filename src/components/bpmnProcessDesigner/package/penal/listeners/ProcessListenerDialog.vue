<!-- 执行器Select -->
<template>
  <Dialog title="Please select listener" v-model="dialogVisible" width="1024px">
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="Name" align="center" prop="name" />
        <el-table-column label="Type" align="center" prop="type">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.BPM_PROCESS_LISTENER_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column label="Event" align="center" prop="event" />
        <el-table-column label="Value Type" align="center" prop="valueType">
          <template #default="scope">
            <dict-tag
              :type="DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE"
              :value="scope.row.valueType"
            />
          </template>
        </el-table-column>
        <el-table-column label="Value" align="center" prop="value" />
        <el-table-column label="Action" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="select(scope.row)"> Select </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- Minute页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>
<script setup lang="ts">
import { ProcessListenerApi, ProcessListenerVO } from '@/api/bpm/processListener'
import { DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'

/** BPM 流程 Form */
defineOptions({ name: 'ProcessListenerDialog' })

const dialogVisible = ref(false) // 弹窗的Whether展示
const loading = ref(true) // 列表的加载中
const list = ref<ProcessListenerVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: '',
  status: CommonStatusEnum.ENABLE
})

/** 打开弹窗 */
const open = async (type: string) => {
  queryParams.pageNo = 1
  queryParams.type = type
  getList()
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProcessListenerApi.getProcessListenerPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 提交Form */
const emit = defineEmits(['success', 'select']) // 定义 success/select Event，用于Action成功后的回调
const select = async (row: ProcessListenerVO) => {
  dialogVisible.value = false
  // 发送Action成功的Event
  emit('select', row)
}
</script>
