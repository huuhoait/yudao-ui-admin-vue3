<template>
  <Dialog v-model="dialogVisible" :title="t('infra.codegen._todo50')" width="800px">
    <!-- 搜索栏 -->
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" label-width="68px">
      <el-form-item :label="t('infra.codegen._todo51')" prop="dataSourceConfigId">
        <el-select
          v-model="queryParams.dataSourceConfigId"
          class="!w-240px"
          :placeholder="t('infra.codegen._todo52')"
        >
          <el-option
            v-for="config in dataSourceConfigList"
            :key="config.id"
            :label="config.name"
            :value="config.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('infra.codegen._todo53')" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          :placeholder="t('infra.codegen._todo54')"
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item :label="t('infra.codegen._todo55')" prop="comment">
        <el-input
          v-model="queryParams.comment"
          class="!w-240px"
          clearable
          :placeholder="t('infra.codegen._todo56')"
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="getList">
          <Icon class="mr-5px" icon="ep:search" />
          {{ t('common.query') }}
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          {{ t('common.reset') }}
        </el-button>
      </el-form-item>
    </el-form>
    <!-- 列表 -->
    <el-row>
      <el-table
        ref="tableRef"
        v-loading="dbTableLoading"
        :data="dbTableList"
        height="260px"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column :show-overflow-tooltip="true" :label="t('infra.codegen._todo53')" prop="name" />
        <el-table-column :show-overflow-tooltip="true" :label="t('infra.codegen._todo55')" prop="comment" />
      </el-table>
    </el-row>
    <!-- 操作 -->
    <template #footer>
      <el-button
        :disabled="tableList.length === 0 || dbTableLoading"
        type="primary"
        @click="handleImportTable"
      >
        {{ t('infra.codegen.import') }}
      </el-button>
      <el-button @click="close">{{ t('common.close') }}</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as CodegenApi from '@/api/infra/codegen'
import * as DataSourceConfigApi from '@/api/infra/dataSourceConfig'
import { ElTable } from 'element-plus'

defineOptions({ name: 'InfraCodegenImportTable' })
const { t } = useI18n() // 国际化

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dbTableLoading = ref(true) // 数据源的加载中
const dbTableList = ref<CodegenApi.DatabaseTableVO[]>([]) // 表的列表
const queryParams = reactive({
  name: undefined,
  comment: undefined,
  dataSourceConfigId: 0
})
const dataSourceConfigList = ref<DataSourceConfigApi.DataSourceConfigVO[]>([]) // 数据源列表

/** 查询表数据 */
const getList = async () => {
  dbTableLoading.value = true
  try {
    dbTableList.value = await CodegenApi.getSchemaTableList(queryParams)
  } finally {
    dbTableLoading.value = false
  }
}

/** 重置操作 */
const resetQuery = async () => {
  queryParams.name = undefined
  queryParams.comment = undefined
  queryParams.dataSourceConfigId = dataSourceConfigList.value[0].id as number
  await getList()
}

/** 打开弹窗 */
const open = async () => {
  // 加载数据源的列表
  dataSourceConfigList.value = await DataSourceConfigApi.getDataSourceConfigList()
  queryParams.dataSourceConfigId = dataSourceConfigList.value[0].id as number
  dialogVisible.value = true
  // 加载表的列表
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 关闭弹窗 */
const close = () => {
  dialogVisible.value = false
  tableList.value = []
}

const tableRef = ref<typeof ElTable>() // 表格的 Ref
const tableList = ref<string[]>([]) // 选中的表名

/** 处理某一行的点击 */
const handleRowClick = (row) => {
  unref(tableRef)?.toggleRowSelection(row)
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  tableList.value = selection.map((item) => item.name)
}

/** 导入按钮操作 */
const handleImportTable = async () => {
  dbTableLoading.value = true
  try {
    await CodegenApi.createCodegenList({
      dataSourceConfigId: queryParams.dataSourceConfigId,
      tableNames: tableList.value
    })
    message.success(t('infra.codegen._todo57'))
    emit('success')
    close()
  } finally {
    dbTableLoading.value = false
  }
}
const emit = defineEmits(['success'])
</script>
