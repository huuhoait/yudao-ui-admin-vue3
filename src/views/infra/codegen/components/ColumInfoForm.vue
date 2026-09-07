<template>
  <el-table ref="dragTable" :data="formData" :max-height="tableHeight" row-key="columnId">
    <el-table-column
      :show-overflow-tooltip="true"
      :label="t('infra.codegen.components._todo65')"
      min-width="10%"
      prop="columnName"
    />
    <el-table-column :label="t('infra.codegen.components._todo66')" min-width="10%">
      <template #default="scope">
        <el-input v-model="scope.row.columnComment" />
      </template>
    </el-table-column>
    <el-table-column
      :show-overflow-tooltip="true"
      :label="t('infra.codegen.components._todo67')"
      min-width="10%"
      prop="dataType"
    />
    <el-table-column :label="t('infra.codegen.components._todo68')" min-width="11%">
      <template #default="scope">
        <el-select v-model="scope.row.javaType">
          <el-option label="Long" value="Long" />
          <el-option label="String" value="String" />
          <el-option label="Integer" value="Integer" />
          <el-option label="Double" value="Double" />
          <el-option label="BigDecimal" value="BigDecimal" />
          <el-option label="LocalDateTime" value="LocalDateTime" />
          <el-option label="Boolean" value="Boolean" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo69')" min-width="10%">
      <template #default="scope">
        <el-input v-model="scope.row.javaField" />
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo70')" min-width="4%">
      <template #default="scope">
        <el-checkbox v-model="scope.row.createOperation" false-value="false" true-value="true" />
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components.edit')" min-width="4%">
      <template #default="scope">
        <el-checkbox v-model="scope.row.updateOperation" false-value="false" true-value="true" />
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo71')" min-width="4%">
      <template #default="scope">
        <el-checkbox
          v-model="scope.row.listOperationResult"
          false-value="false"
          true-value="true"
        />
      </template>
    </el-table-column>
    <el-table-column :label="t('common.query')" min-width="4%">
      <template #default="scope">
        <el-checkbox v-model="scope.row.listOperation" false-value="false" true-value="true" />
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo72')" min-width="10%">
      <template #default="scope">
        <el-select v-model="scope.row.listOperationCondition">
          <el-option label="=" value="=" />
          <el-option label="!=" value="!=" />
          <el-option label=">" value=">" />
          <el-option label=">=" value=">=" />
          <el-option label="<" value="<>" />
          <el-option label="<=" value="<=" />
          <el-option label="LIKE" value="LIKE" />
          <el-option label="BETWEEN" value="BETWEEN" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo73')" min-width="5%">
      <template #default="scope">
        <el-checkbox v-model="scope.row.nullable" false-value="false" true-value="true" />
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo74')" min-width="12%">
      <template #default="scope">
        <el-select v-model="scope.row.htmlType">
          <el-option :label="t('infra.codegen.components._todo75')" value="input" />
          <el-option :label="t('infra.codegen.components._todo76')" value="textarea" />
          <el-option :label="t('infra.codegen.components._todo77')" value="select" />
          <el-option :label="t('infra.codegen.components._todo78')" value="radio" />
          <el-option :label="t('infra.codegen.components._todo79')" value="checkbox" />
          <el-option :label="t('infra.codegen.components._todo80')" value="datetime" />
          <el-option :label="t('infra.codegen.components._todo81')" value="imageUpload" />
          <el-option :label="t('infra.codegen.components._todo82')" value="fileUpload" />
          <el-option :label="t('infra.codegen.components._todo83')" value="editor" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components.dictType')" min-width="12%">
      <template #default="scope">
        <el-select
          v-model="scope.row.dictType"
          :value-on-clear="''"
          clearable
          filterable
          :placeholder="t('common.selectText')"
        >
          <template #header>
            <div class="flex justify-end">
              <el-popover class="box-item" :content="t('infra.codegen.components._todo84')" placement="top-start">
                <template #reference>
                  <el-button :icon="Refresh" size="small" circle @click="getDictOptions" class="" />
                </template>
              </el-popover>
            </div>
          </template>
          <el-option
            v-for="dict in dictOptions"
            :key="dict.id"
            :label="dict.name"
            :value="dict.type"
          />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column :label="t('infra.codegen.components._todo85')" min-width="10%">
      <template #default="scope">
        <el-input v-model="scope.row.example" />
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as CodegenApi from '@/api/infra/codegen'
import * as DictDataApi from '@/api/system/dict/dict.type'

defineOptions({ name: 'InfraCodegenColumInfoForm' })

const { t } = useI18n() // 国际化

const props = defineProps({
  columns: {
    type: Array as unknown as PropType<CodegenApi.CodegenColumnVO[]>,
    default: () => null
  }
})

const formData = ref<CodegenApi.CodegenColumnVO[]>([])
const tableHeight = document.documentElement.scrollHeight - 350 + 'px'

/** 查询字典下拉列表 */
const dictOptions = ref<DictDataApi.DictTypeVO[]>()
const getDictOptions = async () => {
  dictOptions.value = await DictDataApi.getSimpleDictTypeList()
}

watch(
  () => props.columns,
  (columns) => {
    if (!columns) return
    formData.value = columns
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  await getDictOptions()
})
</script>
