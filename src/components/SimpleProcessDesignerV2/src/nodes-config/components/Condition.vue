<template>
  <el-form ref="formRef" :model="condition" :rules="formRules" label-position="top">
    <el-form-item :label="t('simpleProcessDesignerV2.options.conditionConfig.configType')" prop="conditionType">
      <el-radio-group v-model="condition.conditionType" @change="changeConditionType">
        <el-radio
          v-for="(dict, indexConditionType) in conditionConfigTypes"
          :key="indexConditionType"
          :value="dict.value"
          :label="dict.value"
        >
          {{ t(dict.label) }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="condition.conditionType === ConditionType.RULE && condition.conditionGroups"
      :label="t('simpleProcessDesignerV2.condition.conditionRules')"
    >
      <div class="condition-group-tool">
        <div class="flex items-center">
          <div class="mr-4">{{ t('simpleProcessDesignerV2.condition.groupRelationship') }}</div>
          <el-switch
            v-model="condition.conditionGroups.and"
            inline-prompt
            :active-text="t('simpleProcessDesignerV2.condition.and')"
            :inactive-text="t('simpleProcessDesignerV2.condition.or')"
          />
        </div>
      </div>
      <el-space direction="vertical" :spacer="condition.conditionGroups.and ? t('simpleProcessDesignerV2.condition.and') : t('simpleProcessDesignerV2.condition.or')">
        <el-card
          class="condition-group"
          style="width: 530px"
          v-for="(equation, cIdx) in condition.conditionGroups.conditions"
          :key="cIdx"
        >
          <div
            class="condition-group-delete"
            v-if="condition.conditionGroups.conditions.length > 1"
          >
            <Icon
              color="#0089ff"
              icon="ep:circle-close-filled"
              :size="18"
              @click="deleteConditionGroup(condition.conditionGroups.conditions, cIdx)"
            />
          </div>
          <template #header>
            <div class="flex items-center justify-between">
              <div>{{ t('simpleProcessDesignerV2.condition.conditionGroup') }}</div>
              <div class="flex">
                <div class="mr-4">{{ t('simpleProcessDesignerV2.condition.ruleRelationship') }}</div>
                <el-switch
                  v-model="equation.and"
                  inline-prompt
                  :active-text="t('simpleProcessDesignerV2.condition.and')"
                  :inactive-text="t('simpleProcessDesignerV2.condition.or')"
                />
              </div>
            </div>
          </template>

          <div class="flex pt-2" v-for="(rule, rIdx) in equation.rules" :key="rIdx">
            <div class="mr-2">
              <el-form-item
                :prop="`conditionGroups.conditions.${cIdx}.rules.${rIdx}.leftSide`"
                :rules="{
                  required: true,
                  message: t('simpleProcessDesignerV2.condition.leftValueRequired'),
                  trigger: 'change'
                }"
              >
                <el-select style="width: 160px" v-model="rule.leftSide" clearable>
                  <el-option
                    v-for="(field, fIdx) in fieldOptions"
                    :key="fIdx"
                    :label="field.title"
                    :value="field.field"
                    :disabled="!field.required"
                  >
                    <el-tooltip
                      :content="t('simpleProcessDesignerV2.condition.formFieldRequiredTip')"
                      effect="dark"
                      placement="right-start"
                      v-if="!field.required"
                    >
                      <span>{{ field.title }}</span>
                    </el-tooltip>
                  </el-option>
                </el-select>
              </el-form-item>
            </div>
            <div class="mr-2">
              <el-select v-model="rule.opCode" style="width: 100px">
                <el-option
                  v-for="operator in COMPARISON_OPERATORS"
                  :key="operator.value"
                  :label="t(operator.label)"
                  :value="operator.value"
                />
              </el-select>
            </div>
            <div class="mr-2">
              <el-form-item
                :prop="`conditionGroups.conditions.${cIdx}.rules.${rIdx}.rightSide`"
                :rules="{
                  required: true,
                  message: t('simpleProcessDesignerV2.condition.rightValueRequired'),
                  trigger: 'blur'
                }"
              >
                <el-input v-model="rule.rightSide" style="width: 160px" />
              </el-form-item>
            </div>
            <div class="mr-1 flex items-center" v-if="equation.rules.length > 1">
              <Icon icon="ep:delete" :size="18" @click="deleteConditionRule(equation, rIdx)" />
            </div>
            <div class="flex items-center">
              <Icon icon="ep:plus" :size="18" @click="addConditionRule(equation, rIdx)" />
            </div>
          </div>
        </el-card>
      </el-space>
      <div :title="t('simpleProcessDesignerV2.condition.addConditionGroup')" class="mt-4 cursor-pointer">
        <Icon
          color="#0089ff"
          icon="ep:plus"
          :size="24"
          @click="addConditionGroup(condition.conditionGroups?.conditions)"
        />
      </div>
    </el-form-item>
    <el-form-item
      v-if="condition.conditionType === ConditionType.EXPRESSION"
      :label="t('simpleProcessDesignerV2.condition.conditionExpression')"
      prop="conditionExpression"
    >
      <el-input
        type="textarea"
        v-model="condition.conditionExpression"
        clearable
        style="width: 100%"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  COMPARISON_OPERATORS,
  CONDITION_CONFIG_TYPES,
  ConditionType,
  DEFAULT_CONDITION_GROUP_VALUE
} from '../../consts'
import { BpmModelFormType } from '@/utils/constants'
import { useFormFieldsAndStartUser } from '../../node'
import { cloneDeep } from 'lodash-es'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:modelValue'])
const condition = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
const formType = inject<Ref<number>>('formType') // 表单类型
const conditionConfigTypes = computed(() => {
  return CONDITION_CONFIG_TYPES.filter((item) => {
    // 业务表单暂时去掉条件规则选项
    if (formType?.value === BpmModelFormType.CUSTOM && item.value === ConditionType.RULE) {
      return false
    } else {
      return true
    }
  })
})

/** 条件规则可选择的表单字段 */
const fieldOptions = useFormFieldsAndStartUser()

// 表单校验规则
const formRules = reactive({
  conditionType: [{ required: true, message: t('simpleProcessDesignerV2.condition.configTypeRequired'), trigger: 'blur' }],
  conditionExpression: [{ required: true, message: t('simpleProcessDesignerV2.condition.expressionRequired'), trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 切换条件配置方式 */
const changeConditionType = () => {
  if (condition.value.conditionType === ConditionType.RULE) {
    if (!condition.value.conditionGroups) {
      condition.value.conditionGroups = cloneDeep(DEFAULT_CONDITION_GROUP_VALUE)
    }
  }
}
const deleteConditionGroup = (conditions, index) => {
  conditions.splice(index, 1)
}

const deleteConditionRule = (condition, index) => {
  condition.rules.splice(index, 1)
}

const addConditionRule = (condition, index) => {
  const rule = {
    opCode: '==',
    leftSide: '',
    rightSide: ''
  }
  condition.rules.splice(index + 1, 0, rule)
}

const addConditionGroup = (conditions) => {
  const condition = {
    and: true,
    rules: [
      {
        opCode: '==',
        leftSide: '',
        rightSide: ''
      }
    ]
  }
  conditions.push(condition)
}

const validate = async () => {
  if (!formRef) return false
  return await formRef.value.validate()
}

defineExpose({ validate })
</script>

<style lang="scss" scoped>
.condition-group-tool {
  display: flex;
  justify-content: space-between;
  width: 500px;
  margin-bottom: 20px;
}

.condition-group {
  position: relative;

  &:hover {
    border-color: #0089ff;

    .condition-group-delete {
      opacity: 1;
    }
  }

  .condition-group-delete {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    cursor: pointer;
    opacity: 0;
  }
}

::v-deep(.el-card__header) {
  padding: 8px var(--el-card-padding);
  border-bottom: 1px solid var(--el-card-border-color);
  box-sizing: border-box;
}
</style>
