import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import { TableColumn } from '@/types/table'
import * as MailAccountApi from '@/api/system/mail/account'
import { DICT_TYPE } from '@/utils/dict'
import { useI18n } from 'vue-i18n'



// 邮箱账号的列表
const accountList = await MailAccountApi.getSimpleMailAccountList()

// 表单校验
export const getRules = () => {
  const { t } = useI18n()
  return reactive({
  name: [{ required: true, message: t('sys.mail.template.nameRequired'), trigger: 'blur' }],
  code: [{ required: true, message: t('sys.mail.template.codeRequired'), trigger: 'blur' }],
  accountId: [{ required: true, message: t('sys.mail.template.accountIdRequired'), trigger: 'blur' }],
  title: [{ required: true, message: t('sys.mail.template.nameRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('sys.mail.template.contentRequired'), trigger: 'blur' }],
  params: [{ required: true, message: t('sys.mail.template.paramsRequired'), trigger: 'blur' }],
  status: [{ required: true, message: t('sys.mail.template.statusRequired'), trigger: 'blur' }]
})
}

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
export const getCrudSchemas = () => {
  const { t } = useI18n()
  return reactive<CrudSchema[]>([

  {
    label: t('sys.mail.template.code'),
    field: 'code',
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
    label: t('sys.mail.template.name'),
    field: 'name',
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
    label: t('sys.mail.template.titleField'),
    field: 'title'
  },
  {
    label: t('sys.mail.template.content'),
    field: 'content',
    form: {
      component: 'Editor',
      componentProps: {
        valueHtml: '',
        height: 200
      }
    }
  },
  {
    label: t('sys.mail.template.accountId'),
    field: 'accountId',
    width: '200px',
    formatter: (_: Recordable, __: TableColumn, cellValue: number) => {
      return accountList.find((account) => account.id === cellValue)?.mail
    },
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
    },
    form: {
      component: 'Select',
      api: () => accountList,
      componentProps: {
        optionsAlias: {
          labelField: 'mail',
          valueField: 'id'
        }
      }
    }
  },
  {
    label: t('sys.mail.template.nickname'),
    field: 'nickname'
  },
  {
    label: t('sys.mail.template.status'),
    field: 'status',
    isSearch: true,
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: t('sys.mail.template.remark'),
    field: 'remark',
    isTable: false
  },
  {
    label: t('sys.mail.template.createTime'),
    field: 'createTime',
    isForm: false,
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
    }
  },
  {
    label: t('sys.mail.template.operation'),
    field: 'action',
    isForm: false
  }
])
}
export const getSchemas = () => {
  const crudSchemas = getCrudSchemas()
  return useCrudSchemas(crudSchemas)
}
