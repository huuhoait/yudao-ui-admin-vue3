<template>
  <div class="panel-tab__content">
    <div class="panel-tab__content--title">
      <span><Icon icon="ep:menu" style="margin-right: 8px; color: #555" />{{ $t('bpm.design.messageList') }}</span>
      <XButton type="primary" :title="$t('bpm.design.createNewMessage')" preIcon="ep:plus" @click="openModel('message')" />
    </div>
    <el-table :data="messageList" border>
      <el-table-column type="index" :label="$t('bpm.design.serialNumber')" width="60px" />
      <el-table-column :label="$t('bpm.design.messageId')" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column :label="$t('bpm.design.messageName')" prop="name" max-width="300px" show-overflow-tooltip />
      <el-table-column label="操作" width="110px">
        <!-- 补充“编辑”、“移除”功能。相关 issue：https://github.com/YunaiV/yudao-cloud/issues/270 -->
        <template #default="scope">
          <el-button link @click="openEditModel('message', scope.row, scope.$index)" size="small">
            编辑
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            link
            size="small"
            style="color: #ff4d4f"
            @click="removeObject('message', scope.row, scope.$index)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div
      class="panel-tab__content--title"
      style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #eee"
    >
      <span><Icon icon="ep:menu" style="margin-right: 8px; color: #555" />{{ $t('bpm.design.signalList') }}</span>
      <XButton type="primary" :title="$t('bpm.design.createNewSignal')" preIcon="ep:plus" @click="openModel('signal')" />
    </div>
    <el-table :data="signalList" border>
      <el-table-column type="index" :label="$t('bpm.design.serialNumber')" width="60px" />
      <el-table-column :label="$t('bpm.design.signalId')" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column :label="$t('bpm.design.signalName')" prop="name" max-width="300px" show-overflow-tooltip />
      <el-table-column label="操作" width="110px">
        <template #default="scope">
          <el-button link @click="openEditModel('signal', scope.row, scope.$index)" size="small">
            编辑
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            link
            size="small"
            style="color: #ff4d4f"
            @click="removeObject('signal', scope.row, scope.$index)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="modelConfig.title"
      :close-on-click-modal="false"
      width="400px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="modelObjectForm" label-width="90px">
        <el-form-item :label="modelConfig.idLabel">
          <el-input v-model="modelObjectForm.id" clearable />
        </el-form-item>
        <el-form-item :label="modelConfig.nameLabel">
          <el-input v-model="modelObjectForm.name" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('bpm.design.cancel') }}</el-button>
        <el-button type="primary" @click="addNewObject">{{ $t('bpm.design.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
defineOptions({ name: 'SignalAndMassage' })
const { t } = useI18n()
const message = useMessage()
const signalList = ref<any[]>([])
const messageList = ref<any[]>([])
const dialogVisible = ref(false)
const modelType = ref('')
const modelObjectForm = ref<any>({})
const rootElements = ref()
const messageIdMap = ref()
const signalIdMap = ref()
const editingIndex = ref(-1) // 正在编辑的索引，-1 表示新建
const modelConfig = computed(() => {
  const isEdit = editingIndex.value !== -1
  if (modelType.value === 'message') {
    return { title: t('bpm.design.createMessage'), idLabel: t('bpm.design.messageId'), nameLabel: t('bpm.design.messageName') }
  } else {
    return { title: t('bpm.design.createSignal'), idLabel: t('bpm.design.signalId'), nameLabel: t('bpm.design.signalName') }
  }
})
const bpmnInstances = () => (window as any)?.bpmnInstances

const initDataList = () => {
  console.log(window, 'window')
  rootElements.value = bpmnInstances().modeler.getDefinitions().rootElements
  messageIdMap.value = {}
  signalIdMap.value = {}
  messageList.value = []
  signalList.value = []
  rootElements.value.forEach((el) => {
    if (el.$type === 'bpmn:Message') {
      messageIdMap.value[el.id] = true
      messageList.value.push({ ...el })
    }
    if (el.$type === 'bpmn:Signal') {
      signalIdMap.value[el.id] = true
      signalList.value.push({ ...el })
    }
  })
}
const openModel = (type) => {
  modelType.value = type
  editingIndex.value = -1
  modelObjectForm.value = {}
  dialogVisible.value = true
}

const openEditModel = (type, row, index) => {
  modelType.value = type
  editingIndex.value = index
  modelObjectForm.value = { ...row }
  dialogVisible.value = true
}
const addNewObject = () => {
  if (modelType.value === 'message') {
    // 编辑模式
    if (editingIndex.value !== -1) {
      const targetMessage = messageList.value[editingIndex.value]
      // 查找 rootElements 中的原始对象
      const rootMessage = rootElements.value.find(
        (el) => el.$type === 'bpmn:Message' && el.id === targetMessage.id
      )
      if (rootMessage) {
        rootMessage.id = modelObjectForm.value.id
        rootMessage.name = modelObjectForm.value.name
      }
    } else {
      // 新建模式
      if (messageIdMap.value[modelObjectForm.value.id]) {
        message.error('该消息已存在，请修改id后重新保存')
        return
      }
      const messageRef = bpmnInstances().moddle.create('bpmn:Message', modelObjectForm.value)
      rootElements.value.push(messageRef)
    }
  } else {
    // 编辑模式
    if (editingIndex.value !== -1) {
      const targetSignal = signalList.value[editingIndex.value]
      // 查找 rootElements 中的原始对象
      const rootSignal = rootElements.value.find(
        (el) => el.$type === 'bpmn:Signal' && el.id === targetSignal.id
      )
      if (rootSignal) {
        rootSignal.id = modelObjectForm.value.id
        rootSignal.name = modelObjectForm.value.name
      }
    } else {
      // 新建模式
      if (signalIdMap.value[modelObjectForm.value.id]) {
        message.error('该信号已存在，请修改id后重新保存')
        return
      }
      const signalRef = bpmnInstances().moddle.create('bpmn:Signal', modelObjectForm.value)
      rootElements.value.push(signalRef)
    }
  }
  dialogVisible.value = false
  initDataList()
}

const removeObject = (type, row, index) => {
  ElMessageBox.confirm(`确认移除该${type === 'message' ? '消息' : '信号'}吗？`, '提示', {
    confirmButtonText: '确 认',
    cancelButtonText: '取 消'
  })
    .then(() => {
      // 从 rootElements 中移除
      const targetType = type === 'message' ? 'bpmn:Message' : 'bpmn:Signal'
      const elementIndex = rootElements.value.findIndex(
        (el) => el.$type === targetType && el.id === row.id
      )
      if (elementIndex !== -1) {
        rootElements.value.splice(elementIndex, 1)
      }
      // 刷新列表
      initDataList()
      message.success('移除成功')
    })
    .catch(() => console.info('操作取消'))
}

onMounted(() => {
  initDataList()
})
</script>
