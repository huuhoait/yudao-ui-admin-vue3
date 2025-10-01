<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.generate.templateType')" prop="templateType">
          <el-select v-model="formData.templateType">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.generate.frontType')" prop="frontType">
          <el-select v-model="formData.frontType">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_FRONT_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.generate.scene')" prop="scene">
          <el-select v-model="formData.scene">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_SCENE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              {{ t('infra.codegen.generate.parentMenu') }}
              <el-tooltip :content="t('infra.codegen.generate.parentMenuTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-tree-select
            v-model="formData.parentMenuId"
            :data="menus"
            :props="menuTreeProps"
            check-strictly
            node-key="id"
            :placeholder="t('infra.codegen.generate.parentMenuPlaceholder')"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="moduleName">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.moduleName') }}
              <el-tooltip :content="t('infra.codegen.generate.moduleNameTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.moduleName" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="businessName">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.businessName') }}
              <el-tooltip
                :content="t('infra.codegen.generate.businessNameTooltip')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.businessName" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.className') }}
              <el-tooltip :content="t('infra.codegen.generate.classNameTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.className" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="classComment">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.classComment') }}
              <el-tooltip
                :content="t('infra.codegen.generate.classCommentTooltip')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.classComment" />
        </el-form-item>
      </el-col>

      <el-col v-if="formData.genType === '1'" :span="24">
        <el-form-item prop="genPath">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.genPath') }}
              <el-tooltip :content="t('infra.codegen.generate.genPathTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.genPath">
            <template #append>
              <el-dropdown>
                <el-button type="primary">
                  {{ t('infra.codegen.generate.genPathQuickSelect') }}
                  <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="formData.genPath = '/'">
                      {{ t('infra.codegen.generate.genPathReset') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="formData.templateType == 2">
      <el-col :span="24">
        <h4 class="form-header">{{ t('infra.codegen.generate.treeInfoTitle') }}</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="treeParentColumnId">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.treeParentColumn') }}
              <el-tooltip
                :content="t('infra.codegen.generate.treeParentColumnTooltip')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select
            v-model="formData.treeParentColumnId"
            :placeholder="t('infra.codegen.generate.treeColumnPlaceholder')"
          >
            <el-option
              v-for="(column, index) in columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="treeNameColumnId">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.treeNameColumn') }}
              <el-tooltip
                :content="t('infra.codegen.generate.treeNameColumnTooltip')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select
            v-model="formData.treeNameColumnId"
            :placeholder="t('infra.codegen.generate.treeColumnPlaceholder')"
          >
            <el-option
              v-for="(column, index) in columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="formData.templateType == 15">
      <el-col :span="24">
        <h4 class="form-header">{{ t('infra.codegen.generate.masterInfoTitle') }}</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="masterTableId">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.masterTable') }}
              <el-tooltip :content="t('infra.codegen.generate.masterTableTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select
            v-model="formData.masterTableId"
            :placeholder="t('infra.codegen.generate.masterTablePlaceholder')"
          >
            <el-option
              v-for="(tableItem, index) in tables"
              :key="index"
              :label="tableItem.tableName + '：' + tableItem.tableComment"
              :value="tableItem.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="subJoinColumnId">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.subJoinColumn') }}
              <el-tooltip
                :content="t('infra.codegen.generate.subJoinColumnTooltip')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select
            v-model="formData.subJoinColumnId"
            :placeholder="t('infra.codegen.generate.treeColumnPlaceholder')"
          >
            <el-option
              v-for="(column, index) in columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="subJoinMany">
          <template #label>
            <span>
              {{ t('infra.codegen.generate.relation') }}
              <el-tooltip :content="t('infra.codegen.generate.relationTooltip')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-radio-group v-model="formData.subJoinMany">
            <el-radio :value="true">{{ t('infra.codegen.generate.relationOneToMany') }}</el-radio>
            <el-radio :value="false">{{ t('infra.codegen.generate.relationOneToOne') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as CodegenApi from '@/api/infra/codegen'
import * as MenuApi from '@/api/system/menu'
import { PropType, computed, unref } from 'vue'

defineOptions({ name: 'InfraCodegenGenerateInfoForm' })

const { t } = useI18n()

const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableVO>>,
    default: () => null
  },
  columns: {
    type: Array as unknown as PropType<CodegenApi.CodegenColumnVO[]>,
    default: () => []
  }
})

const formRef = ref()
const formData = ref({
  templateType: null as Nullable<number>,
  frontType: null as Nullable<number>,
  scene: null as Nullable<number>,
  moduleName: '',
  businessName: '',
  businessPackage: '',
  className: '',
  classComment: '',
  parentMenuId: null as Nullable<number>,
  genPath: '',
  genType: '',
  masterTableId: undefined as Nullable<number>,
  subJoinColumnId: undefined as Nullable<number>,
  subJoinMany: undefined as Nullable<boolean>,
  treeParentColumnId: undefined as Nullable<number>,
  treeNameColumnId: undefined as Nullable<number>,
  dataSourceConfigId: -1
})

const rules = reactive({
  templateType: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.templateTypeRequired'),
      trigger: 'change'
    }
  ],
  frontType: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.frontTypeRequired'),
      trigger: 'change'
    }
  ],
  scene: [
    { required: true, message: t('infra.codegen.generate.rules.sceneRequired'), trigger: 'change' }
  ],
  moduleName: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.moduleNameRequired'),
      trigger: 'blur'
    }
  ],
  businessName: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.businessNameRequired'),
      trigger: 'blur'
    }
  ],
  businessPackage: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.businessPackageRequired'),
      trigger: 'blur'
    }
  ],
  className: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.classNameRequired'),
      trigger: 'blur'
    }
  ],
  classComment: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.classCommentRequired'),
      trigger: 'blur'
    }
  ],
  masterTableId: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.masterTableRequired'),
      trigger: 'change'
    }
  ],
  subJoinColumnId: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.subJoinColumnRequired'),
      trigger: 'change'
    }
  ],
  subJoinMany: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.subJoinManyRequired'),
      trigger: 'change'
    }
  ],
  treeParentColumnId: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.treeParentColumnRequired'),
      trigger: 'change'
    }
  ],
  treeNameColumnId: [
    {
      required: true,
      message: t('infra.codegen.generate.rules.treeNameColumnRequired'),
      trigger: 'change'
    }
  ]
})

const tables = ref<CodegenApi.CodegenTableVO[]>([])
const menus = ref<any[]>([])
const menuTreeProps = {
  label: 'name'
}

const columns = computed(() => props.columns ?? [])

watch(
  () => props.table,
  async (table) => {
    if (!table) return
    formData.value = { ...formData.value, ...(table as any) }
    if (table.dataSourceConfigId !== undefined && table.dataSourceConfigId >= 0) {
      tables.value = await CodegenApi.getCodegenTableList(table.dataSourceConfigId)
    }
  },
  { deep: true, immediate: true }
)

onMounted(async () => {
  try {
    const resp = await MenuApi.getSimpleMenusList()
    menus.value = handleTree(resp)
  } catch (error) {
    console.error(error)
  }
})

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
