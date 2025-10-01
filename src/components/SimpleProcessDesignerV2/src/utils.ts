import { TimeUnitType, ApproveType, APPROVE_TYPE } from './consts'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()

// 获取条件节点默认的名称
export const getDefaultConditionNodeName = (
  index: number,
  defaultFlow: boolean | undefined
): string => {
  if (defaultFlow) {
    return t('simpleProcessDesignerV2.common.otherwise')
  }
  return t('simpleProcessDesignerV2.common.conditionWithIndex', { index: index + 1 })
}

// 获取包容分支条件节点默认的名称
export const getDefaultInclusiveConditionNodeName = (
  index: number,
  defaultFlow: boolean | undefined
): string => {
  if (defaultFlow) {
    return t('simpleProcessDesignerV2.common.otherwise')
  }
  return t('simpleProcessDesignerV2.inclusiveNode.conditionWithIndex', { index: index + 1 })
}

export const convertTimeUnit = (strTimeUnit: string) => {
  if (strTimeUnit === 'M') {
    return TimeUnitType.MINUTE
  }
  if (strTimeUnit === 'H') {
    return TimeUnitType.HOUR
  }
  if (strTimeUnit === 'D') {
    return TimeUnitType.DAY
  }
  return TimeUnitType.HOUR
}

export const getApproveTypeText = (approveType: ApproveType): string => {
  let approveTypeText = ''
  APPROVE_TYPE.forEach((item) => {
    if (item.value === approveType) {
      approveTypeText = item.label
      return
    }
  })
  return approveTypeText
}
