import { useI18n } from '@/hooks/web/useI18n'

// 获取必填项规则 (支持 i18n)
export const getRequiredRule = () => {
  const { t } = useI18n()
  return {
    required: true,
    message: t('common.required')
  }
}

// 必填项 (保持向后兼容)
// @deprecated 请使用 getRequiredRule() 以获得 i18n 支持
const { t } = useI18n()
export const required = {
  required: true,
  message: t('common.required')
}
