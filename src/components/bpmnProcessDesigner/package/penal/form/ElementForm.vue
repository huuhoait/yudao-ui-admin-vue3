<template>
  <div class="panel-tab__content">
    <el-form label-width="80px">
      <el-form-item label="Process Form">
        <!--        <el-input v-model="formKey" clearable @change="updateElementFormKey" />-->
        <el-select v-model="formKey" clearable @change="updateElementFormKey">
          <el-option v-for="form in formList" :key="form.id" :label="form.name" :value="form.id" />
        </el-select>
      </el-form-item>
      <!--      <el-form-item label="Business Key">-->
      <!--        <el-select v-model="businessKey" @change="updateElementBusinessKey">-->
      <!--          <el-option v-for="i in fieldList" :key="i.id" :value="i.id" :label="i.label" />-->
      <!--          <el-option label="None" value="" />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
    </el-form>

    <!--字段列表-->
    <!--    <div class="element-property list-property">-->
    <!--      <el-divider><Icon icon="ep:coin" /> Form Field</el-divider>-->
    <!--      <el-table :data="fieldList" max-height="240" fit border>-->
    <!--        <el-table-column label="No." type="index" width="50px" />-->
    <!--        <el-table-column label="Field Name" prop="label" min-width="80px" show-overflow-tooltip />-->
    <!--        <el-table-column-->
    <!--          label="Field Type"-->
    <!--          prop="type"-->
    <!--          min-width="80px"-->
    <!--          :formatter="(row) => fieldType[row.type] || row.type"-->
    <!--          show-overflow-tooltip-->
    <!--        />-->
    <!--        <el-table-column-->
    <!--          label="Default Value"-->
    <!--          prop="defaultValue"-->
    <!--          min-width="80px"-->
    <!--          show-overflow-tooltip-->
    <!--        />-->
    <!--        <el-table-column label="Action" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button type="primary" link @click="openFieldForm(scope, scope.$index)"-->
    <!--              >Edit</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeField(scope, scope.$index)"-->
    <!--              >Remove</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->
    <!--    </div>-->
    <!--    <div class="element-drawer__button">-->
    <!--      <el-button type="primary" proIcon="ep:plus" @click="openFieldForm(null, -1)">Add Field</el-button>-->
    <!--    </div>-->

    <!--Field Config侧边栏-->
    <!--    <el-drawer-->
    <!--      v-model="fieldModelVisible"-->
    <!--      title="Field Config"-->
    <!--      :size="`${width}px`"-->
    <!--      append-to-body-->
    <!--      destroy-on-close-->
    <!--    >-->
    <!--      <el-form :model="formFieldForm" label-width="90px">-->
    <!--        <el-form-item label="Field ID">-->
    <!--          <el-input v-model="formFieldForm.id" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Type">-->
    <!--          <el-select-->
    <!--            v-model="formFieldForm.typeType"-->
    <!--            placeholder="Please select field type"-->
    <!--            clearable-->
    <!--            @change="changeFieldTypeType"-->
    <!--          >-->
    <!--            <el-option v-for="(value, key) of fieldType" :label="value" :value="key" :key="key" />-->
    <!--          </el-select>-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Type Name" v-if="formFieldForm.typeType === 'custom'">-->
    <!--          <el-input v-model="formFieldForm.type" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Name">-->
    <!--          <el-input v-model="formFieldForm.label" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Time Format" v-if="formFieldForm.typeType === 'date'">-->
    <!--          <el-input v-model="formFieldForm.datePattern" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Default Value">-->
    <!--          <el-input v-model="formFieldForm.defaultValue" clearable />-->
    <!--        </el-form-item>-->
    <!--      </el-form>-->

    <!--      &lt;!&ndash; 枚举Value设置 &ndash;&gt;-->
    <!--      <template v-if="formFieldForm.type === 'enum'">-->
    <!--        <el-divider key="enum-divider" />-->
    <!--        <p class="listener-filed__title" key="enum-title">-->
    <!--          <span><Icon icon="ep:menu" />Enum Value List:</span>-->
    <!--          <el-button type="primary" @click="openFieldOptionForm(null, -1, 'enum')"-->
    <!--            >Add Enum Value</el-button-->
    <!--          >-->
    <!--        </p>-->
    <!--        <el-table :data="fieldEnumList" key="enum-table" max-height="240" fit border>-->
    <!--          <el-table-column label="No." width="50px" type="index" />-->
    <!--          <el-table-column label="Enum Value ID" prop="id" min-width="100px" show-overflow-tooltip />-->
    <!--          <el-table-column label="Enum Value Name" prop="name" min-width="100px" show-overflow-tooltip />-->
    <!--          <el-table-column label="Action" width="90px">-->
    <!--            <template #default="scope">-->
    <!--              <el-button-->
    <!--                type="primary"-->
    <!--                link-->
    <!--                @click="openFieldOptionForm(scope, scope.$index, 'enum')"-->
    <!--                >Edit</el-button-->
    <!--              >-->
    <!--              <el-divider direction="vertical" />-->
    <!--              <el-button-->
    <!--                type="primary"-->
    <!--                link-->
    <!--                style="color: #ff4d4f"-->
    <!--                @click="removeFieldOptionItem(scope, scope.$index, 'enum')"-->
    <!--                >Remove</el-button-->
    <!--              >-->
    <!--            </template>-->
    <!--          </el-table-column>-->
    <!--        </el-table>-->
    <!--      </template>-->

    <!--      &lt;!&ndash; Validate规则 &ndash;&gt;-->
    <!--      <el-divider key="validation-divider" />-->
    <!--      <p class="listener-filed__title" key="validation-title">-->
    <!--        <span><Icon icon="ep:menu" />Constraint List:</span>-->
    <!--        <el-button type="primary" @click="openFieldOptionForm(null, -1, 'constraint')"-->
    <!--          >Add Constraint</el-button-->
    <!--        >-->
    <!--      </p>-->
    <!--      <el-table :data="fieldConstraintsList" key="validation-table" max-height="240" fit border>-->
    <!--        <el-table-column label="No." width="50px" type="index" />-->
    <!--        <el-table-column label="Constraint Name" prop="name" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="Constraint Config" prop="config" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="Action" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              @click="openFieldOptionForm(scope, scope.$index, 'constraint')"-->
    <!--              >Edit</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeFieldOptionItem(scope, scope.$index, 'constraint')"-->
    <!--              >Remove</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->

    <!--      &lt;!&ndash; Form属性 &ndash;&gt;-->
    <!--      <el-divider key="property-divider" />-->
    <!--      <p class="listener-filed__title" key="property-title">-->
    <!--        <span><Icon icon="ep:menu" />Field Property List:</span>-->
    <!--        <el-button type="primary" @click="openFieldOptionForm(null, -1, 'property')"-->
    <!--          >Add Property</el-button-->
    <!--        >-->
    <!--      </p>-->
    <!--      <el-table :data="fieldPropertiesList" key="property-table" max-height="240" fit border>-->
    <!--        <el-table-column label="No." width="50px" type="index" />-->
    <!--        <el-table-column label="Property ID" prop="id" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="Property Value" prop="value" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="Action" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              @click="openFieldOptionForm(scope, scope.$index, 'property')"-->
    <!--              >Edit</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeFieldOptionItem(scope, scope.$index, 'property')"-->
    <!--              >Remove</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->

    <!--      &lt;!&ndash; 底部按钮 &ndash;&gt;-->
    <!--      <div class="element-drawer__button">-->
    <!--        <el-button>Cancel</el-button>-->
    <!--        <el-button type="primary" @click="saveField">Save</el-button>-->
    <!--      </div>-->
    <!--    </el-drawer>-->

    <!--    <el-dialog-->
    <!--      v-model="fieldOptionModelVisible"-->
    <!--      :title="optionModelTitle"-->
    <!--      width="600px"-->
    <!--      append-to-body-->
    <!--      destroy-on-close-->
    <!--    >-->
    <!--      <el-form :model="fieldOptionForm" label-width="96px">-->
    <!--        <el-form-item label="ID" v-if="fieldOptionType !== 'constraint'" key="option-id">-->
    <!--          <el-input v-model="fieldOptionForm.id" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Name" v-if="fieldOptionType !== 'property'" key="option-name">-->
    <!--          <el-input v-model="fieldOptionForm.name" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Config" v-if="fieldOptionType === 'constraint'" key="option-config">-->
    <!--          <el-input v-model="fieldOptionForm.config" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="Value" v-if="fieldOptionType === 'property'" key="option-value">-->
    <!--          <el-input v-model="fieldOptionForm.value" clearable />-->
    <!--        </el-form-item>-->
    <!--      </el-form>-->
    <!--      <template #footer>-->
    <!--        <el-button @click="fieldOptionModelVisible = false">Cancel</el-button>-->
    <!--        <el-button type="primary" @click="saveFieldOption">Confirm</el-button>-->
    <!--      </template>-->
    <!--    </el-dialog>-->
  </div>
</template>

<script lang="ts" setup>
import * as FormApi from '@/api/bpm/form'

defineOptions({ name: 'ElementForm' })

const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')

const formKey = ref<number | undefined>()
const bpmnELement = ref()
const elExtensionElements = ref()
const formData = ref()
const otherExtensions = ref()

const bpmnInstances = () => (window as any)?.bpmnInstances
const resetFormList = () => {
  bpmnELement.value = bpmnInstances().bpmnElement
  formKey.value = bpmnELement.value.businessObject.formKey
  // if (formKey.value?.length > 0) {
  //   formKey.value = parseInt(formKey.value)
  // }
  // 获取元素Extension Properties 或者 创建Extension Properties
  elExtensionElements.value =
    bpmnELement.value.businessObject.get('extensionElements') ||
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })
  // 获取元素FormConfig 或者 创建新的FormConfig
  formData.value =
    elExtensionElements.value.values.filter((ex) => ex.$type === `${prefix}:FormData`)?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:FormData`, { fields: [] })

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value = elExtensionElements.value.values.filter(
    (ex) => ex.$type !== `${prefix}:FormData`
  )

  // 更新元素Extension Properties，避免后续报错
  updateElementExtensions()
}
const updateElementFormKey = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    formKey: formKey.value
  })
}
const updateElementExtensions = () => {
  // 更新回扩展元素
  const newElExtensionElements = bpmnInstances().moddle.create(`bpmn:ExtensionElements`, {
    values: otherExtensions.value.concat(formData.value)
  })
  // 更新到元素上
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    extensionElements: newElExtensionElements
  })
}

const formList = ref<Array<{ id: number; name: string }>>([]) // Process Form的下拉框的数据
onMounted(async () => {
  formList.value = await FormApi.getFormSimpleList()
  formKey.value = formKey.value != null ? Number(formKey.value) : undefined
})

watch(
  () => props.id,
  (val) => {
    val &&
      val.length &&
      nextTick(() => {
        resetFormList()
      })
  },
  { immediate: true }
)
</script>
