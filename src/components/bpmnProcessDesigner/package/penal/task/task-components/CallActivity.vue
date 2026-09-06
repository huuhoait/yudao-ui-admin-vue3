<template>
  <div>
    <el-form label-width="100px">
      <el-form-item label="Instance Name" prop="processInstanceName">
        <el-input
          v-model="formData.processInstanceName"
          clearable
          placeholder="Please enter instance name"
          @change="updateCallActivityAttr('processInstanceName')"
        />
      </el-form-item>

      <!-- TODO 需要可选择已存在的流程 -->
      <el-form-item label="Called Process" prop="calledElement">
        <el-input
          v-model="formData.calledElement"
          clearable
          placeholder="Please enter called process"
          @change="updateCallActivityAttr('calledElement')"
        />
      </el-form-item>

      <el-form-item label="Inherit Variables" prop="inheritVariables">
        <el-switch
          v-model="formData.inheritVariables"
          @change="updateCallActivityAttr('inheritVariables')"
        />
      </el-form-item>

      <el-form-item label="Inherit Business Key" prop="inheritBusinessKey">
        <el-switch
          v-model="formData.inheritBusinessKey"
          @change="updateCallActivityAttr('inheritBusinessKey')"
        />
      </el-form-item>

      <el-form-item v-if="!formData.inheritBusinessKey" label="Business Key Expression" prop="businessKey">
        <el-input
          v-model="formData.businessKey"
          clearable
          placeholder="Please enter business key expression"
          @change="updateCallActivityAttr('businessKey')"
        />
      </el-form-item>

      <el-divider />
      <div>
        <div class="flex mb-10px">
          <el-text>Input Parameter</el-text>
          <el-button
            class="ml-auto"
            type="primary"
            size="small"
            @click="openVariableForm('in', null, -1)"
          >
            <Icon icon="ep:plus" class="mr-1px" /> Add Parameter
          </el-button>
        </div>
        <el-table :data="inVariableList" max-height="240" fit border>
          <el-table-column label="Source" prop="source" min-width="100px" show-overflow-tooltip />
          <el-table-column label="Target" prop="target" min-width="100px" show-overflow-tooltip />
          <el-table-column label="Action" width="110px">
            <template #default="scope">
              <el-button link @click="openVariableForm('in', scope.row, scope.$index)" size="small">
                Edit
              </el-button>
              <el-divider direction="vertical" />
              <el-button
                link
                size="small"
                style="color: #ff4d4f"
                @click="removeVariable('in', scope.$index)"
              >
                Remove
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-divider />
      <div>
        <div class="flex mb-10px">
          <el-text>Output Parameter</el-text>
          <el-button
            class="ml-auto"
            type="primary"
            size="small"
            @click="openVariableForm('out', null, -1)"
          >
            <Icon icon="ep:plus" class="mr-1px" /> Add Parameter
          </el-button>
        </div>
        <el-table :data="outVariableList" max-height="240" fit border>
          <el-table-column label="Source" prop="source" min-width="100px" show-overflow-tooltip />
          <el-table-column label="Target" prop="target" min-width="100px" show-overflow-tooltip />
          <el-table-column label="Action" width="110px">
            <template #default="scope">
              <el-button
                link
                @click="openVariableForm('out', scope.row, scope.$index)"
                size="small"
              >
                Edit
              </el-button>
              <el-divider direction="vertical" />
              <el-button
                link
                size="small"
                style="color: #ff4d4f"
                @click="removeVariable('out', scope.$index)"
              >
                Remove
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>

    <!-- 添加或修改参数 -->
    <el-dialog
      v-model="variableDialogVisible"
      title="Parameter Config"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="varialbeFormData" label-width="80px" ref="varialbeFormRef">
        <el-form-item label="Source:" prop="source">
          <el-input v-model="varialbeFormData.source" clearable />
        </el-form-item>
        <el-form-item label="Target:" prop="target">
          <el-input v-model="varialbeFormData.target" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="variableDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveVariable">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'CallActivity' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')
const message = useMessage()

const formData = ref({
  processInstanceName: '',
  calledElement: '',
  inheritVariables: false,
  businessKey: '',
  inheritBusinessKey: false,
  calledElementType: 'key'
})
const inVariableList = ref()
const outVariableList = ref()
const variableType = ref() // 参数类型
const editingVariableIndex = ref(-1) // 编辑参数下标
const variableDialogVisible = ref(false)
const varialbeFormData = ref({
  source: '',
  target: ''
})

const bpmnInstances = () => (window as any)?.bpmnInstances
const bpmnElement = ref()
const otherExtensionList = ref()

const initCallActivity = () => {
  bpmnElement.value = bpmnInstances().bpmnElement
  console.log(bpmnElement.value.businessObject, 'callActivity')

  // 初始化所有配置项
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = bpmnElement.value.businessObject[key] ?? formData.value[key]
  })

  otherExtensionList.value = [] // 其他扩展配置
  inVariableList.value = []
  outVariableList.value = []
  // 初始化输入参数
  bpmnElement.value.businessObject?.extensionElements?.values?.forEach((ex) => {
    if (ex.$type === `${prefix}:In`) {
      inVariableList.value.push(ex)
    } else if (ex.$type === `${prefix}:Out`) {
      outVariableList.value.push(ex)
    } else {
      otherExtensionList.value.push(ex)
    }
  })

  // 默认添加
  // bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
  //   calledElementType: 'key'
  // })
}

const updateCallActivityAttr = (attr) => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    [attr]: formData.value[attr]
  })
}

const openVariableForm = (type, data, index) => {
  editingVariableIndex.value = index
  variableType.value = type
  varialbeFormData.value = index === -1 ? {} : { ...data }
  variableDialogVisible.value = true
}

const removeVariable = async (type, index) => {
  try {
    await message.delConfirm()
    if (type === 'in') {
      inVariableList.value.splice(index, 1)
    }
    if (type === 'out') {
      outVariableList.value.splice(index, 1)
    }
    updateElementExtensions()
  } catch {}
}

const saveVariable = () => {
  if (editingVariableIndex.value === -1) {
    if (variableType.value === 'in') {
      inVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:In`, { ...varialbeFormData.value })
      )
    }
    if (variableType.value === 'out') {
      outVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:Out`, { ...varialbeFormData.value })
      )
    }
    updateElementExtensions()
  } else {
    if (variableType.value === 'in') {
      inVariableList.value[editingVariableIndex.value].source = varialbeFormData.value.source
      inVariableList.value[editingVariableIndex.value].target = varialbeFormData.value.target
    }
    if (variableType.value === 'out') {
      outVariableList.value[editingVariableIndex.value].source = varialbeFormData.value.source
      outVariableList.value[editingVariableIndex.value].target = varialbeFormData.value.target
    }
  }
  variableDialogVisible.value = false
}

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [...inVariableList.value, ...outVariableList.value, ...otherExtensionList.value]
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions
  })
}

watch(
  () => props.id,
  (val) => {
    val &&
      val.length &&
      nextTick(() => {
        initCallActivity()
      })
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped></style>
