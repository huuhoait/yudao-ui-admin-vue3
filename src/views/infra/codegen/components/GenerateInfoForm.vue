<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item :label="t('infra.codegen.components._todo86')" prop="templateType">
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
        <el-form-item :label="t('infra.codegen.components._todo87')" prop="frontType">
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
        <el-form-item :label="t('infra.codegen.components._todo88')" prop="scene">
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
              {{ t('infra.codegen.components._todo103') }}
              <el-tooltip :content="t('infra.codegen.components._todo89')" placement="top">
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
            :placeholder="t('infra.codegen.components._todo90')"
          />
        </el-form-item>
      </el-col>

      <!--      <el-col :span="12">-->
      <!--        <el-form-item prop="packageName">-->
      <!--          <span slot="label">-->
      <!--            生成包路径-->
      <!--            <el-tooltip :content="t('infra.codegen.components._todo91')" placement="top">-->
      <!--              <i class="el-icon-question"></i>-->
      <!--            </el-tooltip>-->
      <!--          </span>-->
      <!--          <el-input v-model="formData.packageName" />-->
      <!--        </el-form-item>-->
      <!--      </el-col>-->

      <el-col :span="12">
        <el-form-item prop="moduleName">
          <template #label>
            <span>
              {{ t('infra.codegen.components._todo104') }}
              <el-tooltip
                :content="t('infra.codegen.components._todo92')"
                placement="top"
              >
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
              {{ t('infra.codegen.components._todo105') }}
              <el-tooltip
                :content="t('infra.codegen.components._todo93')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.businessName" />
        </el-form-item>
      </el-col>

      <!--      <el-col :span="12">-->
      <!--        <el-form-item prop="businessPackage">-->
      <!--          <span slot="label">-->
      <!--            业务包-->
      <!--            <el-tooltip :content="t('infra.codegen.components._todo94')" placement="top">-->
      <!--              <i class="el-icon-question"></i>-->
      <!--            </el-tooltip>-->
      <!--          </span>-->
      <!--          <el-input v-model="formData.businessPackage" />-->
      <!--        </el-form-item>-->
      <!--      </el-col>-->

      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <span>
              {{ t('infra.codegen.components._todo106') }}
              <el-tooltip
                :content="t('infra.codegen.components._todo95')"
                placement="top"
              >
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
              {{ t('infra.codegen.components._todo107') }}
              <el-tooltip :content="t('infra.codegen.components._todo96')" placement="top">
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
              {{ t('infra.codegen.components._todo108') }}
              <el-tooltip
                :content="t('infra.codegen.components._todo97')"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.genPath">
            <template #append>
              <el-dropdown>
                <el-button type="primary">
                  {{ t('infra.codegen.components._todo109') }}
                  <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="formData.genPath = '/'">
                      {{ t('infra.codegen.components._todo110') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 树表信息 -->
    <el-row v-if="formData.templateType == 2">
      <el-col :span="24">
        <h4 class="form-header">{{ t('infra.codegen.components._todo111') }}</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="treeParentColumnId">
          <template #label>
            <span>
              {{ t('infra.codegen.components._todo112') }}
              <el-tooltip :content="t('infra.codegen.components._todo98')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeParentColumnId" :placeholder="t('common.selectText')">
            <el-option
              v-for="(column, index) in props.columns"
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
              {{ t('infra.codegen.components._todo113') }}
              <el-tooltip :content="t('infra.codegen.components._todo99')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeNameColumnId" :placeholder="t('common.selectText')">
            <el-option
              v-for="(column, index) in props.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 主表信息 -->
    <el-row v-if="formData.templateType == 15">
      <el-col :span="24">
        <h4 class="form-header">{{ t('infra.codegen.components._todo114') }}</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="masterTableId">
          <template #label>
            <span>
              {{ t('infra.codegen.components._todo115') }}
              <el-tooltip :content="t('infra.codegen.components._todo100')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.masterTableId" :placeholder="t('common.selectText')">
            <el-option
              v-for="(table0, index) in tables"
              :key="index"
              :label="table0.tableName + '：' + table0.tableComment"
              :value="table0.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="subJoinColumnId">
          <template #label>
            <span>
              {{ t('infra.codegen.components._todo116') }}
              <el-tooltip :content="t('infra.codegen.components._todo101')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.subJoinColumnId" :placeholder="t('common.selectText')">
            <el-option
              v-for="(column, index) in props.columns"
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
              {{ t('infra.codegen.components._todo117') }}
              <el-tooltip :content="t('infra.codegen.components._todo102')" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-radio-group v-model="formData.subJoinMany" :placeholder="t('common.selectText')">
            <el-radio :value="true">{{ t('infra.codegen.components._todo118') }}</el-radio>
            <el-radio :value="false">{{ t('infra.codegen.components._todo119') }}</el-radio>
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
import { PropType } from 'vue'

defineOptions({ name: 'InfraCodegenGenerateInfoForm' })

const { t } = useI18n() // 国际化

const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableSaveReqVO>>,
    default: () => null
  },
  columns: {
    type: Array as unknown as PropType<CodegenApi.CodegenColumnVO[]>,
    default: () => null
  }
})

const formRef = ref()
const formData = ref<CodegenApi.CodegenTableSaveReqVO>(
  CodegenApi.createEmptyCodegenTableSaveReqVO()
)

const rules = reactive({
  templateType: [required],
  frontType: [required],
  scene: [required],
  moduleName: [required],
  businessName: [required],
  businessPackage: [required],
  className: [required],
  classComment: [required],
  masterTableId: [required],
  subJoinColumnId: [required],
  subJoinMany: [required],
  treeParentColumnId: [required],
  treeNameColumnId: [required]
})

const tables = ref<CodegenApi.CodegenTableVO[]>([]) // 表定义列表
const menus = ref<any[]>([])
const menuTreeProps = {
  label: 'name'
}

watch(
  () => props.table,
  async (table) => {
    if (!table) return
    formData.value = table
    // 加载表列表
    if (table.dataSourceConfigId >= 0) {
      tables.value = await CodegenApi.getCodegenTableList(formData.value.dataSourceConfigId)
    }
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  try {
    // 加载菜单
    const resp = await MenuApi.getSimpleMenusList()
    menus.value = handleTree(resp)
  } catch {}
})

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
