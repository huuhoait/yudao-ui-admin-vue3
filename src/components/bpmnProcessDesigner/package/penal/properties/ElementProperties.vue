<template>
  <div class="panel-tab__content">
    <el-table :data="elementPropertyList" max-height="240" fit border>
      <el-table-column label="No." width="50px" type="index" />
      <el-table-column label="Property Name" prop="name" min-width="100px" show-overflow-tooltip />
      <el-table-column label="Property Value" prop="value" min-width="100px" show-overflow-tooltip />
      <el-table-column label="Action" width="110px">
        <template #default="scope">
          <el-button link @click="openAttributesForm(scope.row, scope.$index)" size="small">
            Edit
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            link
            size="small"
            style="color: #ff4d4f"
            @click="removeAttributes(scope.row, scope.$index)"
          >
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button">
      <el-button type="primary" @click="openAttributesForm(null, -1)">
        <Icon icon="ep:plus" class="mr-1px" /> Add Property
      </el-button>
    </div>

    <el-dialog
      v-model="propertyFormModelVisible"
      title="Property Config"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="propertyForm" label-width="80px" ref="attributeFormRef">
        <el-form-item label="Property Name:" prop="name">
          <el-input v-model="propertyForm.name" clearable />
        </el-form-item>
        <el-form-item label="Property Value:" prop="value">
          <el-input v-model="propertyForm.value" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="propertyFormModelVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveAttribute">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
defineOptions({ name: 'ElementProperties' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')
// const width = inject('width')

const elementPropertyList = ref<any[]>([])
const propertyForm = ref<any>({})
const editingPropertyIndex = ref(-1)
const propertyFormModelVisible = ref(false)
const otherExtensionList = ref()
const bpmnElementProperties = ref()
const bpmnElementPropertyList = ref()
const attributeFormRef = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const resetAttributesList = () => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement
  const businessObject = bpmnElement.businessObject

  otherExtensionList.value = [] // Others扩展Config
  bpmnElementProperties.value =
    businessObject?.extensionElements?.values?.filter((ex) => {
      if (ex.$type !== `${prefix}:Properties`) {
        otherExtensionList.value.push(ex)
      }
      return ex.$type === `${prefix}:Properties`
    }) ?? []

  // Save所有的 Extension Properties字段
  bpmnElementPropertyList.value = bpmnElementProperties.value.reduce(
    (pre, current) => pre.concat(current.values),
    []
  )
  // 复制 Display
  elementPropertyList.value = JSON.parse(JSON.stringify(bpmnElementPropertyList.value ?? []))
}
const openAttributesForm = (attr, index) => {
  editingPropertyIndex.value = index
  propertyForm.value = index === -1 ? {} : JSON.parse(JSON.stringify(attr))
  propertyFormModelVisible.value = true
  nextTick(() => {
    if (attributeFormRef.value) attributeFormRef.value.clearValidate()
  })
}
const removeAttributes = (attr, index) => {
  console.log(attr, 'attr')
  ElMessageBox.confirm('Confirm removing this property?', 'Tip', {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel'
  })
    .then(() => {
      elementPropertyList.value.splice(index, 1)
      bpmnElementPropertyList.value.splice(index, 1)
      // 新建一个属性字段的Save列表
      const propertiesObject = bpmnInstances().moddle.create(`${prefix}:Properties`, {
        values: bpmnElementPropertyList.value
      })
      updateElementExtensions(propertiesObject)
      resetAttributesList()
    })
    .catch(() => console.info('Operation cancelled'))
}
const saveAttribute = () => {
  console.log(propertyForm.value, 'propertyForm.value')
  const { name, value } = propertyForm.value
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  const bpmnElement = instances.bpmnElement

  if (editingPropertyIndex.value !== -1) {
    instances.modeling.updateModdleProperties(
      bpmnElement,
      bpmnElementPropertyList.value[editingPropertyIndex.value],
      {
        name,
        value
      }
    )
  } else {
    // 新建属性字段
    const newPropertyObject = instances.moddle.create(`${prefix}:Property`, {
      name,
      value
    })
    // 新建一个属性字段的Save列表
    const propertiesObject = instances.moddle.create(`${prefix}:Properties`, {
      values: bpmnElementPropertyList.value.concat([newPropertyObject])
    })
    updateElementExtensions(propertiesObject)
  }
  propertyFormModelVisible.value = false
  resetAttributesList()
}
const updateElementExtensions = (properties) => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  const bpmnElement = instances.bpmnElement
  const extensions = instances.moddle.create('bpmn:ExtensionElements', {
    values: otherExtensionList.value.concat([properties])
  })
  instances.modeling.updateProperties(bpmnElement, {
    extensionElements: extensions
  })
}

watch(
  () => props.id,
  (val) => {
    if (val) {
      val && val.length && resetAttributesList()
    }
  },
  { immediate: true }
)
</script>
