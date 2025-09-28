<template>
  <doc-alert :title="$t('bpm.processInstance.report.docAlertTitle')" url="https://doc.iocoder.cn/bpm/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item :label="$t('bpm.processInstance.report.form.startUser')" prop="startUserId">
        <el-select
          v-model="queryParams.startUserId"
          :placeholder="$t('bpm.processInstance.report.form.startUserPlaceholder')"
          class="!w-240px"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('bpm.processInstance.report.form.name')" prop="name">
        <el-input
          v-model="queryParams.name"
          :placeholder="$t('bpm.processInstance.report.form.namePlaceholder')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="$t('bpm.processInstance.report.form.status')" prop="status">
        <el-select
          v-model="queryParams.status"
          :placeholder="$t('bpm.processInstance.report.form.statusPlaceholder')"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('bpm.processInstance.report.form.startTime')" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          :start-placeholder="$t('bpm.processInstance.report.form.startDatePlaceholder')"
          :end-placeholder="$t('bpm.processInstance.report.form.endDatePlaceholder')"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="$t('bpm.processInstance.report.form.endTime')" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          :start-placeholder="$t('bpm.processInstance.report.form.endStartPlaceholder')"
          :end-placeholder="$t('bpm.processInstance.report.form.endEndPlaceholder')"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item
        v-for="(item, index) in formFields"
        :key="index"
        :label="item.title"
        :prop="item.field"
      >
        <!-- TODO @lesan：目前只支持input类型的字符串搜索 -->
        <el-input
          :disabled="item.type !== 'input'"
          v-model="queryParams.formFieldsParams[item.field]"
          :placeholder="t('bpm.processInstance.report.form.dynamicPlaceholder', { title: item.title })"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> {{ $t('common.query') }}</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> {{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" border :data="list">
      <el-table-column :label="$t('bpm.processInstance.report.table.name')" align="center" prop="name" fixed="left" width="200" />
      <el-table-column :label="$t('bpm.processInstance.report.table.startUser')" align="center" prop="startUser.nickname" width="120" />
      <el-table-column :label="$t('bpm.processInstance.report.table.status')" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('bpm.processInstance.report.table.startTime')"
        align="center"
        prop="startTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        :label="$t('bpm.processInstance.report.table.endTime')"
        align="center"
        prop="endTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        v-for="(item, index) in formFields"
        :key="index"
        :label="item.title"
        :prop="item.field"
        width="120"
      >
        <!-- TODO @lesan：可以根据formField的type进行展示方式的控制，现在全部以字符串 -->
        <template #default="scope">
          {{ scope.row.formVariables[item.field] ?? '' }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" fixed="right" width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            v-hasPermi="['bpm:process-instance:cancel']"
            @click="handleDetail(scope.row)"
          >
            {{ $t('common.detail') }}
          </el-button>
          <el-button
            link
            type="primary"
            v-if="scope.row.status === 1"
            v-hasPermi="['bpm:process-instance:query']"
            @click="handleCancel(scope.row)"
          >
            {{ $t('common.cancel') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as UserApi from '@/api/system/user'
import * as DefinitionApi from '@/api/bpm/definition'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { ElMessageBox } from 'element-plus'

defineOptions({ name: 'BpmProcessInstanceReport' })

const router = useRouter() // 路由
const { query } = useRoute()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const formFields = ref()
const processDefinitionId = query.processDefinitionId as string
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  startUserId: undefined,
  name: '',
  processDefinitionKey: query.processDefinitionKey,
  status: undefined,
  createTime: [],
  endTime: [],
  formFieldsParams: {}
})
const queryFormRef = ref() // 搜索的表单
const userList = ref<any[]>([]) // 用户列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProcessInstanceApi.getProcessInstanceManagerPage({
      ...queryParams,
      formFieldsParams: JSON.stringify(queryParams.formFieldsParams)
    })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取流程定义 */
const getProcessDefinition = async () => {
  const processDefinition = await DefinitionApi.getProcessDefinition(processDefinitionId)
  formFields.value = parseFormCreateFields(processDefinition.formFields)
}

/** 解析表单字段 */
const parseFormCreateFields = (formFields?: string[]) => {
  const result: Array<Record<string, any>> = []
  if (formFields) {
    formFields.forEach((fieldStr: string) => {
      parseFormFields(JSON.parse(fieldStr), result)
    })
  }
  return result
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.formFieldsParams = {}
  handleQuery()
}

/** 查看详情 */
const handleDetail = (row) => {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.id
    }
  })
}

/** 取消按钮操作 */
const handleCancel = async (row) => {
  // 二次确认
  const { value } = await ElMessageBox.prompt(
    t('bpm.processInstance.report.messages.cancelPromptMessage'),
    t('bpm.processInstance.report.messages.cancelPromptTitle'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
      inputErrorMessage: t('bpm.processInstance.report.messages.cancelReasonRequired')
    }
  )
  // 发起取消
  await ProcessInstanceApi.cancelProcessInstanceByAdmin(row.id, value)
  message.success(t('bpm.processInstance.report.messages.cancelSuccess'))
  // 刷新列表
  await getList()
}

/** 初始化 **/
onMounted(async () => {
  // 获取流程定义，用于 table column 的展示
  await getProcessDefinition()
  // 获取流程列表
  await getList()
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
