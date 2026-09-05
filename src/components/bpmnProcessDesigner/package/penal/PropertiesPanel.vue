<template>
  <div class="process-panel__container" :style="{ width: `${width}px`, maxHeight: '600px' }">
    <el-collapse v-model="activeTab" v-if="isReady">
      <el-collapse-item name="base">
        <!-- class="panel-tab__title" -->
        <template #title>
          <Icon icon="ep:info-filled" />
          General</template
        >
        <ElementBaseInfo
          :id-edit-disabled="idEditDisabled"
          :business-object="elementBusinessObject"
          :type="elementType"
          :model="model"
        />
      </el-collapse-item>
      <el-collapse-item name="condition" v-if="elementType === 'Process'" key="message">
        <template #title><Icon icon="ep:comment" />Message & Signal</template>
        <signal-and-massage />
      </el-collapse-item>
      <el-collapse-item name="condition" v-if="conditionFormVisible" key="condition">
        <template #title><Icon icon="ep:promotion" />Flow Condition</template>
        <flow-condition :business-object="elementBusinessObject" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item name="condition" v-if="formVisible" key="form">
        <template #title><Icon icon="ep:list" />Form</template>
        <element-form :id="elementId" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item name="task" v-if="isTaskCollapseItemShow(elementType)" key="task">
        <template #title>
          <Icon icon="ep:checked" />{{ getTaskCollapseItemName(elementType) }}
        </template>
        <element-task :id="elementId" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item
        name="multiInstance"
        v-if="elementType.indexOf('Task') !== -1"
        key="multiInstance"
      >
        <template #title><Icon icon="ep:help-filled" />Multi-approval Method</template>
        <element-multi-instance
          :id="elementId"
          :business-object="elementBusinessObject"
          :type="elementType"
        />
      </el-collapse-item>
      <el-collapse-item name="listeners" key="listeners">
        <template #title><Icon icon="ep:bell-filled" />Execution Listener</template>
        <element-listeners :id="elementId" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item name="taskListeners" v-if="elementType === 'UserTask'" key="taskListeners">
        <template #title><Icon icon="ep:bell-filled" />Task Listener</template>
        <user-task-listeners :id="elementId" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item name="extensions" key="extensions">
        <template #title><Icon icon="ep:circle-plus-filled" />Extension Properties</template>
        <element-properties :id="elementId" :type="elementType" />
      </el-collapse-item>
      <el-collapse-item name="other" key="other">
        <template #title><Icon icon="ep:promotion" />Others</template>
        <element-other-config :id="elementId" />
      </el-collapse-item>
      <el-collapse-item name="customConfig" key="customConfig">
        <template #title><Icon icon="ep:tools" />Custom Config</template>
        <element-custom-config
          :id="elementId"
          :type="elementType"
          :business-object="elementBusinessObject"
        />
      </el-collapse-item>
      <!-- 新增的Timer EventConfig项 -->
      <el-collapse-item v-if="elementType === 'IntermediateCatchEvent'" name="timeEvent">
        <template #title><Icon icon="ep:timer" />Timer Event</template>
        <!-- 相关 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ICNRW2 -->
        <TimeEventConfig :businessObject="elementBusinessObject" :key="elementId" />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script lang="ts" setup>
import ElementBaseInfo from './base/ElementBaseInfo.vue'
import ElementOtherConfig from './other/ElementOtherConfig.vue'
import ElementTask from './task/ElementTask.vue'
import ElementMultiInstance from './multi-instance/ElementMultiInstance.vue'
import FlowCondition from './flow-condition/FlowCondition.vue'
import SignalAndMassage from './signal-message/SignalAndMessage.vue'
import ElementListeners from './listeners/ElementListeners.vue'
import ElementProperties from './properties/ElementProperties.vue'
// import ElementForm from './form/ElementForm.vue'
import UserTaskListeners from './listeners/UserTaskListeners.vue'
import { getTaskCollapseItemName, isTaskCollapseItemShow } from './task/data'
import TimeEventConfig from './time-event-config/TimeEventConfig.vue'
import { ref, watch } from 'vue'

defineOptions({ name: 'MyPropertiesPanel' })

/**
 * 侧边栏
 * @Author MiyueFE
 * @Home https://github.com/miyuesc
 * @Date 2021Year3Month31日18:57:51
 */
const props = defineProps({
  bpmnModeler: {
    type: Object,
    default: () => {}
  },
  prefix: {
    type: String,
    default: 'camunda'
  },
  width: {
    type: Number,
    default: 480
  },
  idEditDisabled: {
    type: Boolean,
    default: false
  },
  model: Object // 流程模型的数据
})

const activeTab = ref('base')
const elementId = ref('')
const elementType = ref('')
const elementBusinessObject = ref<any>({}) // 元素 businessObject 镜像，提供给需要做判断的组件使用
const conditionFormVisible = ref(false) // Flow Condition设置
const formVisible = ref(false) // FormConfig
const bpmnElement = ref()
const isReady = ref(false)

provide('prefix', props.prefix)
provide('width', props.width)

// 初始化 bpmnInstances
const initBpmnInstances = () => {
  if (!props.bpmnModeler) return false
  try {
    const instances = {
      modeler: props.bpmnModeler,
      modeling: props.bpmnModeler.get('modeling'),
      moddle: props.bpmnModeler.get('moddle'),
      eventBus: props.bpmnModeler.get('eventBus'),
      bpmnFactory: props.bpmnModeler.get('bpmnFactory'),
      elementFactory: props.bpmnModeler.get('elementFactory'),
      elementRegistry: props.bpmnModeler.get('elementRegistry'),
      replace: props.bpmnModeler.get('replace'),
      selection: props.bpmnModeler.get('selection')
    }

    // 检查所有实例Whether都存在
    const allInstancesExist = Object.values(instances).every((instance) => instance)
    if (allInstancesExist) {
      const w = window as any
      w.bpmnInstances = instances
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to init bpmnInstances:', error)
    return false
  }
}

const bpmnInstances = () => (window as any)?.bpmnInstances

// 监听 props.bpmnModeler 然后 initModels
watch(
  () => props.bpmnModeler,
  async () => {
    // 避免加载Hour 流程图 并未加载完成
    if (!props.bpmnModeler) {
      console.log('Missing props.bpmnModeler')
      return
    }

    try {
      // 等待 modeler 初始化完成
      await nextTick()
      if (initBpmnInstances()) {
        isReady.value = true
        await nextTick()
        getActiveElement()
      } else {
        console.error('modeler instance not fully initialized')
      }
    } catch (error) {
      console.error('Init failed:', error)
    }
  },
  {
    immediate: true
  }
)

const getActiveElement = () => {
  if (!isReady.value || !props.bpmnModeler) return

  // 初始第一个选中元素 bpmn:Process
  initFormOnChanged(null)
  props.bpmnModeler.on('import.done', (e) => {
    console.log(e, 'eeeee')
    initFormOnChanged(null)
  })
  // 监听SelectEvent，修改当前激活的元素以及Form
  props.bpmnModeler.on('selection.changed', ({ newSelection }) => {
    initFormOnChanged(newSelection[0] || null)
  })
  props.bpmnModeler.on('element.changed', ({ element }) => {
    // 保证 修改 "Default Flow" 类似需要修改多个元素的Event发生的Hour候，更新Form的元素与原选中元素不一致。
    if (element && element.id === elementId.value) {
      initFormOnChanged(element)
    }
  })
}

// 初始化数据
const initFormOnChanged = (element) => {
  if (!isReady.value || !bpmnInstances()) return

  let activatedElement = element
  if (!activatedElement) {
    activatedElement =
      bpmnInstances().elementRegistry.find((el) => el.type === 'bpmn:Process') ??
      bpmnInstances().elementRegistry.find((el) => el.type === 'bpmn:Collaboration')
  }
  if (!activatedElement) return

  try {
    console.log(`
                ----------
        select element changed:
                  id:  ${activatedElement.id}
                type:  ${activatedElement.businessObject.$type}
                ----------
                `)
    console.log('businessObject: ', activatedElement.businessObject)
    bpmnInstances().bpmnElement = activatedElement
    bpmnElement.value = activatedElement
    elementId.value = activatedElement.id
    elementType.value = activatedElement.type.split(':')[1] || ''
    elementBusinessObject.value = JSON.parse(JSON.stringify(activatedElement.businessObject))
    conditionFormVisible.value = !!(
      elementType.value === 'SequenceFlow' &&
      activatedElement.source &&
      activatedElement.source.type.indexOf('StartEvent') === -1
    )
    formVisible.value = elementType.value === 'UserTask' || elementType.value === 'StartEvent'
  } catch (error) {
    console.error('Failed to init form data:', error)
  }
}

onBeforeUnmount(() => {
  const w = window as any
  w.bpmnInstances = null
  isReady.value = false
})

watch(
  () => elementId.value,
  () => {
    activeTab.value = 'base'
  }
)
</script>
