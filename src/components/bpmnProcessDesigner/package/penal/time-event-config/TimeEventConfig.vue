<template>
  <div class="panel-tab__content">
    <div style="margin-top: 10px">
      <span>Type:</span>
      <el-button-group>
        <el-button size="small" :type="type === 'time' ? 'primary' : ''" @click="setType('time')">
          Date
        </el-button>
        <el-button
          size="small"
          :type="type === 'duration' ? 'primary' : ''"
          @click="setType('duration')"
        >
          Duration
        </el-button>
        <el-button size="small" :type="type === 'cycle' ? 'primary' : ''" @click="setType('cycle')">
          Loop
        </el-button>
      </el-button-group>
      <el-icon v-if="valid" color="green" style="margin-left: 8px"><CircleCheckFilled /></el-icon>
    </div>
    <div style="display: flex; margin-top: 10px; align-items: center">
      <span>Condition:</span>
      <el-input
        v-model="condition"
        :placeholder="placeholder"
        style="width: calc(100% - 100px)"
        :readonly="type !== 'duration' && type !== 'cycle'"
        @focus="handleInputFocus"
        @blur="updateNode"
      >
        <template #suffix>
          <el-tooltip v-if="!valid" content="Format Error" placement="top">
            <el-icon color="orange"><WarningFilled /></el-icon>
          </el-tooltip>
          <el-tooltip :content="helpText" placement="top">
            <el-icon color="#409EFF" style="cursor: pointer" @click="showHelp = true">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
          <el-button
            v-if="type === 'time'"
            @click="showDatePicker = true"
            style="margin-left: 4px"
            circle
            size="small"
          >
            <Icon icon="ep:calendar" />
          </el-button>
          <el-button
            v-if="type === 'duration'"
            @click="showDurationDialog = true"
            style="margin-left: 4px"
            circle
            size="small"
          >
            <Icon icon="ep:timer" />
          </el-button>
          <el-button
            v-if="type === 'cycle'"
            @click="showCycleDialog = true"
            style="margin-left: 4px"
            circle
            size="small"
          >
            <Icon icon="ep:setting" />
          </el-button>
        </template>
      </el-input>
    </div>
    <!-- 时间选择器 -->
    <el-dialog
      v-model="showDatePicker"
      title="Select Time"
      width="400px"
      @close="showDatePicker = false"
    >
      <el-date-picker
        v-model="dateValue"
        type="datetime"
        placeholder="Select Date Time"
        style="width: 100%"
        @change="onDateChange"
      />
      <template #footer>
        <el-button @click="showDatePicker = false">Cancel</el-button>
        <el-button type="primary" @click="onDateConfirm">Confirm</el-button>
      </template>
    </el-dialog>
    <!-- 持续时长选择器 -->
    <el-dialog
      v-model="showDurationDialog"
      title="Timer Config"
      width="600px"
      @close="showDurationDialog = false"
    >
      <DurationConfig :value="condition" @change="onDurationChange" />
      <template #footer>
        <el-button @click="showDurationDialog = false">Cancel</el-button>
        <el-button type="primary" @click="onDurationConfirm">Confirm</el-button>
      </template>
    </el-dialog>
    <!-- 循环配置器 -->
    <el-dialog
      v-model="showCycleDialog"
      title="Timer Config"
      width="800px"
      @close="showCycleDialog = false"
    >
      <CycleConfig :value="condition" @change="onCycleChange" />
      <template #footer>
        <el-button @click="showCycleDialog = false">Cancel</el-button>
        <el-button type="primary" @click="onCycleConfirm">Confirm</el-button>
      </template>
    </el-dialog>
    <!-- 帮助说明 -->
    <el-dialog v-model="showHelp" title="Format Description" width="600px" @close="showHelp = false">
      <div v-html="helpHtml"></div>
      <template #footer>
        <el-button @click="showHelp = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { CircleCheckFilled, WarningFilled, QuestionFilled } from '@element-plus/icons-vue'
import DurationConfig from './DurationConfig.vue'
import CycleConfig from './CycleConfig.vue'
const bpmnInstances = () => (window as any).bpmnInstances
const props = defineProps({ businessObject: Object })
const type = ref('time')
const condition = ref('')
const valid = ref(true)
const showDatePicker = ref(false)
const showDurationDialog = ref(false)
const showCycleDialog = ref(false)
const showHelp = ref(false)
const dateValue = ref(null)

const placeholder = computed(() => {
  if (type.value === 'time') return 'Please enter time'
  if (type.value === 'duration') return 'Please enter duration'
  if (type.value === 'cycle') return 'Please enter loop expression'
  return ''
})
const helpText = computed(() => {
  if (type.value === 'time') return 'Select Specific Time'
  if (type.value === 'duration') return 'ISO 8601 format, e.g. PT1H'
  if (type.value === 'cycle') return 'CRON expression or ISO 8601 cycle'
  return ''
})
const helpHtml = computed(() => {
  if (type.value === 'duration') {
    return `How long to wait before the timer fires. S means seconds, M means minutes, D means days; P marks a period and T marks a period given down to the time of day.<br>
    The format is ISO 8601: one year, two months, three days, four hours, five minutes and six seconds is written as P1Y2M3DT4H5M6S.<br>
    P is the leading marker and T separates the date part from the time part. T cannot be omitted when only a time is given — "once per hour" is written as PT1H.`
  }
  if (type.value === 'cycle') {
    return `Supports a CRON expression (e.g. 0 0/30 * * * ?) or an ISO 8601 cycle (e.g. R3/PT10M).`
  }
  return ''
})

// 初始化和监听
function syncFromBusinessObject() {
  if (props.businessObject) {
    const timerDef = (props.businessObject.eventDefinitions || [])[0]
    if (timerDef) {
      if (timerDef.timeDate) {
        type.value = 'time'
        condition.value = timerDef.timeDate.body
      } else if (timerDef.timeDuration) {
        type.value = 'duration'
        condition.value = timerDef.timeDuration.body
      } else if (timerDef.timeCycle) {
        type.value = 'cycle'
        condition.value = timerDef.timeCycle.body
      }
    }
  }
}
onMounted(syncFromBusinessObject)

// 切换类型
function setType(t) {
  type.value = t
  condition.value = ''
  updateNode()
}

// 输入校验
watch([type, condition], () => {
  valid.value = validate()
  // updateNode() // 可以注释掉，避免频繁触发
})

function validate() {
  if (type.value === 'time') {
    return !!condition.value && !isNaN(Date.parse(condition.value))
  }
  if (type.value === 'duration') {
    return /^P.*$/.test(condition.value)
  }
  if (type.value === 'cycle') {
    return /^([0-9*\/?, ]+|R\d*\/P.*)$/.test(condition.value)
  }
  return true
}

// 选择时间
function onDateChange(val) {
  dateValue.value = val
}
function onDateConfirm() {
  if (dateValue.value) {
    condition.value = new Date(dateValue.value).toISOString()
    showDatePicker.value = false
    updateNode()
  }
}

// 持续时长
function onDurationChange(val) {
  condition.value = val
}
function onDurationConfirm() {
  showDurationDialog.value = false
  updateNode()
}

// 循环
function onCycleChange(val) {
  condition.value = val
}
function onCycleConfirm() {
  showCycleDialog.value = false
  updateNode()
}

// 输入框聚焦时弹窗（可选）
function handleInputFocus() {
  if (type.value === 'time') showDatePicker.value = true
  if (type.value === 'duration') showDurationDialog.value = true
  if (type.value === 'cycle') showCycleDialog.value = true
}

// 同步到节点
function updateNode() {
  const moddle = window.bpmnInstances?.moddle
  const modeling = window.bpmnInstances?.modeling
  const elementRegistry = window.bpmnInstances?.elementRegistry
  if (!moddle || !modeling || !elementRegistry) return

  // 获取元素
  if (!props.businessObject || !props.businessObject.id) return
  const element = elementRegistry.get(props.businessObject.id)
  if (!element) return

  // 1. 复用原有 timerDef，或新建
  let timerDef =
    element.businessObject.eventDefinitions && element.businessObject.eventDefinitions[0]
  if (!timerDef) {
    timerDef = bpmnInstances().bpmnFactory.create('bpmn:TimerEventDefinition', {})
    modeling.updateProperties(element, {
      eventDefinitions: [timerDef]
    })
  }

  // 2. 清空原有
  delete timerDef.timeDate
  delete timerDef.timeDuration
  delete timerDef.timeCycle

  // 3. 设置新的
  if (type.value === 'time' && condition.value) {
    timerDef.timeDate = bpmnInstances().bpmnFactory.create('bpmn:FormalExpression', {
      body: condition.value
    })
  } else if (type.value === 'duration' && condition.value) {
    timerDef.timeDuration = bpmnInstances().bpmnFactory.create('bpmn:FormalExpression', {
      body: condition.value
    })
  } else if (type.value === 'cycle' && condition.value) {
    timerDef.timeCycle = bpmnInstances().bpmnFactory.create('bpmn:FormalExpression', {
      body: condition.value
    })
  }

  bpmnInstances().modeling.updateProperties(toRaw(element), {
    eventDefinitions: [timerDef]
  })
}

watch(
  () => props.businessObject,
  (val) => {
    if (val) {
      nextTick(() => {
        syncFromBusinessObject()
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 相关样式 */
</style>
