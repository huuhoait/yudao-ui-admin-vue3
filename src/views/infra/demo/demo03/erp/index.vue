<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item :label="t('infra.demo.demo03.erp.name')" prop="name">
        <el-input
          v-model="queryParams.name"
          :placeholder="t('infra.demo.demo03.erp.inputName')"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item :label="t('infra.demo.demo03.erp.gender')" prop="sex">
        <el-select v-model="queryParams.sex" :placeholder="t('infra.demo.demo03.erp.selectGender')" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('common.createTime')" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          :start-placeholder="t('infra.demo.demo03.erp.startDate')"
          :end-placeholder="t('infra.demo.demo03.erp.endDate')"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> {{ t('common.query') }}</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> {{ t('common.reset') }}</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['infra:demo03-student:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> {{ t('infra.demo.demo03.erp.create') }}
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['infra:demo03-student:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> {{ t('infra.demo.demo03.erp.export') }}
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['infra:demo03-student:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> {{ t('infra.demo.demo03.erp.deleteBatch') }}
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      highlight-current-row
      @current-change="handleCurrentChange"
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column :label="t('infra.demo.demo03.erp.id')" align="center" prop="id" />
      <el-table-column :label="t('infra.demo.demo03.erp.name')" align="center" prop="name" />
      <el-table-column :label="t('infra.demo.demo03.erp.gender')" align="center" prop="sex">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="scope.row.sex" />
        </template>
      </el-table-column>
      <el-table-column
        :label="t('infra.demo.demo03.erp.dateBirth')"
        align="center"
        prop="birthday"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column :label="t('infra.demo.demo03.erp.bio')" align="center" prop="description" />
      <el-table-column
        :label="t('common.createTime')"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column :label="t('infra.demo.demo03.erp.action')" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['infra:demo03-student:update']"
          >
            {{ t('infra.demo.demo03.erp.edit') }}
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['infra:demo03-student:delete']"
          >
            {{ t('infra.demo.demo03.erp.delete') }}
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

  <!-- 表单弹窗：添加/修改 -->
  <Demo03StudentForm ref="formRef" @success="getList" />
  <!-- 子表的列表 -->
  <ContentWrap>
    <el-tabs model-value="demo03Course">
      <el-tab-pane :label="t('infra.demo.demo03.erp.studentCourses')" name="demo03Course">
        <Demo03CourseList :student-id="currentRow?.id" />
      </el-tab-pane>
      <el-tab-pane :label="t('infra.demo.demo03.erp.studentClass')" name="demo03Grade">
        <Demo03GradeList :student-id="currentRow?.id" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { Demo03StudentApi, Demo03Student } from '@/api/infra/demo/demo03/erp'
import Demo03StudentForm from './Demo03StudentForm.vue'
import Demo03CourseList from './components/Demo03CourseList.vue'
import Demo03GradeList from './components/Demo03GradeList.vue'

/** 学生 列表 */
defineOptions({ name: 'Demo03Student' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<Demo03Student[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  sex: undefined,
  description: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await Demo03StudentApi.getDemo03StudentPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await Demo03StudentApi.deleteDemo03Student(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除学生 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    await Demo03StudentApi.deleteDemo03StudentList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (records: Demo03Student[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await Demo03StudentApi.exportDemo03Student(queryParams)
    download.excel(data, t('infra.demo.demo03.erp.exportFileName'))
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 选中行操作 */
const currentRow = ref<Demo03Student>() // 选中行
const handleCurrentChange = (row: Demo03Student) => {
  currentRow.value = row
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
