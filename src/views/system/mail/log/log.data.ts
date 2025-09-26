import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import * as MailAccountApi from '@/api/system/mail/account'
import { DICT_TYPE } from '@/utils/dict'
import { useI18n } from 'vue-i18n'

// 邮箱账号的列表
const accountList = await MailAccountApi.getSimpleMailAccountList()

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
export const getCrudSchemas = () => {
  const { t } = useI18n()
  return reactive<CrudSchema[]>([
  {
    label: t('sys.mail.log.id'),
    field: 'id'
  },
  {
    label: t('sys.mail.log.sendTime'),
    field: 'sendTime',
    formatter: dateFormatter,
    search: {
      show: true,
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        type: 'daterange',
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
        style: {
          width: '240px'
        }
      }
    },
    detail: {
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  {
    label: t('sys.mail.log.toMail'),
    field: 'toMail'
  },
  {
    label: t('sys.mail.log.userId'),
    field: 'userId',
    isSearch: true,
    isTable: false,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.log.userType'),
    field: 'userType',
    dictType: DICT_TYPE.USER_TYPE,
    dictClass: 'number',
    isSearch: true,
    isTable: false,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.log.templateTitle'),
    field: 'templateTitle'
  },
  {
    label: t('sys.mail.log.templateContent'),
    field: 'templateContent',
    isTable: false
  },
  {
    label: t('sys.mail.log.templateParams'),
    field: 'templateParams',
    isTable: false
  },
  {
    label: t('sys.mail.log.sendStatus'),
    field: 'sendStatus',
    dictType: DICT_TYPE.SYSTEM_MAIL_SEND_STATUS,
    dictClass: 'string',
    isSearch: true,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.log.accountId'),
    field: 'accountId',
    isTable: false,
    search: {
      show: true,
      component: 'Select',
      api: () => accountList,
      componentProps: {
        optionsAlias: {
          labelField: 'mail',
          valueField: 'id'
        },
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.log.fromMail'),
    field: 'fromMail',
    table: {
      label: t('sys.mail.log.accountId')
    }
  },
  {
    label: t('sys.mail.log.templateId'),
    field: 'templateId',
    isSearch: true,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.log.templateCode'),
    field: 'templateCode',
    isTable: false
  },
  {
    label: t('sys.mail.log.templateNickname'),
    field: 'templateNickname',
    isTable: false
  },
  {
    label: t('sys.mail.log.sendMessageId'),
    field: 'sendMessageId',
    isTable: false
  },
  {
    label: t('sys.mail.log.sendException'),
    field: 'sendException',
    isTable: false
  },
  {
    label: t('sys.mail.log.createTime'),
    field: 'createTime',
    isTable: false,
    formatter: dateFormatter,
    detail: {
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  {
    label: t('sys.mail.log.operation'),
    field: 'action',
    isDetail: false
  }
])  
}
export const getSchemas = () => {
  const crudSchemas = getCrudSchemas()
  return useCrudSchemas(crudSchemas)
}
