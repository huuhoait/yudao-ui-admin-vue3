<template>
  <doc-alert :title="t('system.mail.log.mailConfig')" url="https://doc.iocoder.cn/mail" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item :label="t('system.mail.log._todo71')" prop="toMail">
        <el-input
          v-model="queryParams.toMail"
          :placeholder="t('system.mail.log._todo72')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('system.mail.log.emailAccount')" prop="accountId">
        <el-select
          v-model="queryParams.accountId"
          :placeholder="t('system.mail.log.selectEmailAccount')"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="account in accountList"
            :key="account.id"
            :value="account.id!"
            :label="account.mail"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('system.mail.log.templateId')" prop="templateId">
        <el-input
          v-model="queryParams.templateId"
          :placeholder="t('system.mail.log.inputTemplateId')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('system.mail.log.sendStatus')" prop="sendStatus">
        <el-select
          v-model="queryParams.sendStatus"
          :placeholder="t('system.mail.log.selectSendStatus')"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('system.mail.log.userId')" prop="userId">
        <el-input
          v-model="queryParams.userId"
          :placeholder="t('system.mail.log.inputUserId')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('system.mail.log.userType')" prop="userType">
        <el-select
          v-model="queryParams.userType"
          :placeholder="t('system.mail.log.selectUserType')"
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
      <el-form-item :label="t('system.mail.log.sendTime')" prop="sendTime">
        <el-date-picker
          v-model="queryParams.sendTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          :start-placeholder="t('system.mail.log.startDate')"
          :end-placeholder="t('system.mail.log.endDate')"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> {{ t('common.query') }}</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> {{ t('common.reset') }}</el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:mail-log:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> {{ t('system.mail.log.export') }}
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column :label="t('system.mail.log.id')" align="center" prop="id" />
      <el-table-column
        :label="t('system.mail.log.sendTime')"
        align="center"
        prop="sendTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column :label="t('system.mail.log._todo60')" align="center" width="150">
        <template #default="scope">
          <div v-if="scope.row.userType && scope.row.userId">
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="scope.row.userType" />
            <div>{{ '(' + scope.row.userId + ')' }}</div>
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.mail.log._todo61')" align="center" width="300">
        <template #default="scope">
          <div class="text-left">
            <div v-if="scope.row.toMails && scope.row.toMails.length > 0">
              {{ t('system.mail.log._todo68') }}
              <span v-for="(mail, index) in scope.row.toMails" :key="mail">
                {{ mail }}<span v-if="Number(index) < scope.row.toMails.length - 1">、</span>
              </span>
            </div>
            <div v-if="scope.row.ccMails && scope.row.ccMails.length > 0">
              {{ t('system.mail.log._todo69') }}
              <span v-for="(mail, index) in scope.row.ccMails" :key="mail">
                {{ mail }}<span v-if="Number(index) < scope.row.ccMails.length - 1">、</span>
              </span>
            </div>
            <div v-if="scope.row.bccMails && scope.row.bccMails.length > 0">
              {{ t('system.mail.log._todo70') }}
              <span v-for="(mail, index) in scope.row.bccMails" :key="mail">
                {{ mail }}<span v-if="Number(index) < scope.row.bccMails.length - 1">、</span>
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.mail.log._todo62')" align="center" prop="templateTitle" width="200" />
      <el-table-column :label="t('system.mail.log.sendStatus')" align="center" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS" :value="scope.row.sendStatus" />
        </template>
      </el-table-column>
      <el-table-column :label="t('system.mail.log.emailAccount')" align="center" width="200">
        <template #default="scope">
          {{ getAccountMail(scope.row.accountId) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('system.mail.log.templateId')" align="center" prop="templateId" />
      <el-table-column :label="t('system.mail.log.action')" align="center" fixed="right" class-name="fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(scope.row)"
            v-hasPermi="['system:mail-log:query']"
          >
            {{ t('system.mail.log.detail') }}
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
  <MailLogDetail ref="detailRef" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as MailAccountApi from '@/api/system/mail/account'
import * as MailLogApi from '@/api/system/mail/log'
import MailLogDetail from './MailLogDetail.vue'

defineOptions({ name: 'SystemMailLog' })

const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryFormRef = ref() // 搜索的表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  toMail: '',
  accountId: undefined,
  templateId: undefined,
  sendStatus: undefined,
  userId: undefined,
  userType: undefined,
  sendTime: []
})
const exportLoading = ref(false) // 导出的加载中
const accountList = ref<MailAccountApi.MailAccountVO[]>([]) // 邮箱账号列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MailLogApi.getMailLogPage(queryParams)
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

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await MailLogApi.exportMailLog(queryParams)
    download.excel(data, '邮件日志.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 详情操作 */
const detailRef = ref()
const openDetail = (data: MailLogApi.MailLogVO) => {
  detailRef.value.open(data)
}

/** 获取邮箱账号名称 */
const getAccountMail = (accountId: number) => {
  const account = accountList.value.find((account) => account.id === accountId)
  return account?.mail || ''
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载邮箱账号列表
  accountList.value = await MailAccountApi.getSimpleMailAccountList()
})
</script>
