<template>
  <doc-alert :title="t('sys.notify.message.notifyMessageManagement')" url="https://doc.iocoder.cn/notify/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item :label="t('sys.notify.message.userId')" prop="userId">
        <el-input
          v-model="queryParams.userId"
          :placeholder="t('sys.notify.message.userIdPlaceholder')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('sys.notify.message.userType')" prop="userType">
        <el-select
          v-model="queryParams.userType"
          :placeholder="t('sys.notify.message.userTypePlaceholder')"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.USER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('sys.notify.message.templateCode')" prop="templateCode">
        <el-input
          v-model="queryParams.templateCode"
          :placeholder="t('sys.notify.message.templateCodePlaceholder')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('sys.notify.message.templateType')" prop="templateType">
        <el-select
          v-model="queryParams.templateType"
          :placeholder="t('sys.notify.message.templateTypePlaceholder')"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('sys.notify.message.createTime')" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          :start-placeholder="t('common.startTimeText')"
          :end-placeholder="t('common.endTimeText')"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> {{ t('sys.notify.message.search') }}</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> {{ t('sys.notify.message.reset') }}</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column :label="t('sys.notify.message.id')" align="center" prop="id" />
      <el-table-column :label="t('sys.notify.message.userType')" align="center" prop="userType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="scope.row.userType" />
        </template>
      </el-table-column>
      <el-table-column :label="t('sys.notify.message.userId')" align="center" prop="userId" width="80" />
      <el-table-column :label="t('sys.notify.message.templateCode')" align="center" prop="templateCode" width="80" />
      <el-table-column :label="t('sys.notify.message.templateNickname')" align="center" prop="templateNickname" width="180" />
      <el-table-column
        :label="t('sys.notify.message.templateContent')"
        align="center"
        prop="templateContent"
        width="200"
        show-overflow-tooltip
      />
      <el-table-column
        :label="t('sys.notify.message.templateParams')"
        align="center"
        prop="templateParams"
        width="180"
        show-overflow-tooltip
      >
        <template #default="scope"> {{ scope.row.templateParams }}</template>
      </el-table-column>
      <el-table-column :label="t('sys.notify.message.templateType')" align="center" prop="templateType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column :label="t('sys.notify.message.readStatus')" align="center" prop="readStatus" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.readStatus" />
        </template>
      </el-table-column>
      <el-table-column
        :label="t('sys.notify.message.readTime')"
        align="center"
        prop="readTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        :label="t('sys.notify.message.createTime')"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column :label="t('sys.notify.message.operation')" align="center" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(scope.row)"
            v-hasPermi="['system:notify-message:query']"
          >
            {{ t('sys.notify.message.detail') }}
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

  <!-- 表单弹窗：详情 -->
  <NotifyMessageDetail ref="detailRef" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import NotifyMessageDetail from './NotifyMessageDetail.vue'

defineOptions({ name: 'SystemNotifyMessage' })

const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userType: undefined,
  userId: undefined,
  templateCode: undefined,
  templateType: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NotifyMessageApi.getNotifyMessagePage(queryParams)
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

/** 详情操作 */
const detailRef = ref()
const openDetail = (data: NotifyMessageApi.NotifyMessageVO) => {
  detailRef.value.open(data)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
