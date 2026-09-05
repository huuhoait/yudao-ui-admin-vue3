<!-- ExpressionSelect -->
<template>
  <Dialog title="Please select expression" v-model="dialogVisible" width="1024px">
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="Name" align="center" prop="name" />
        <el-table-column label="Expression" align="center" prop="expression" />
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
import { CommonStatusEnum } from '@/utils/constants'
import { ProcessExpressionApi, ProcessExpressionVO } from '@/api/bpm/processExpression'

/** BPM 流程 Form */
defineOptions({ name: 'ProcessExpressionDialog' })

const dialogVisible = ref(false) // 弹窗的Whether展示
const loading = ref(true) // 列表的加载中
const list = ref<ProcessExpressionVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: '',
  status: CommonStatusEnum.ENABLE
})

/** 打开弹窗 */
const open = (type: string) => {
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
    const data = await ProcessExpressionApi.getProcessExpressionPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 提交Form */
const emit = defineEmits(['success', 'select']) // 定义 success/select Event，用于Action成功后的回调
const select = async (row: ProcessExpressionVO) => {
  dialogVisible.value = false
  // 发送Action成功的Event
  emit('select', row)
}
</script>
