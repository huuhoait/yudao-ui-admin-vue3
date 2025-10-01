import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { useI18n } from 'vue-i18n'

// 表单校验 - 需要在组件中使用 useI18n 来获取 t 函数
export const getRules = () => {
  const { t } = useI18n()
  return reactive({
    mail: [
      { required: true, message: t('sys.mail.account.mailRequired'), trigger: 'blur' },
      {
        type: 'email',
        message: t('sys.mail.account.mailInvalid'),
        trigger: ['blur', 'change']
      }
    ],
    username: [
      { required: true, message: t('sys.mail.account.usernameRequired'), trigger: 'blur' }
    ],
    password: [
      { required: true, message: t('sys.mail.account.passwordRequired'), trigger: 'blur' }
    ],
    host: [{ required: true, message: t('sys.mail.account.hostRequired'), trigger: 'blur' }],
    port: [{ required: true, message: t('sys.mail.account.portRequired'), trigger: 'blur' }],
    sslEnable: [{ required: true, message: t('sys.mail.account.sslEnable'), trigger: 'blur' }],
    starttlsEnable: [
      { required: true, message: t('sys.mail.account.starttlsEnable'), trigger: 'blur' }
    ]
  })
}

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
export const getCrudSchemas = () => {
  const { t } = useI18n()
  return reactive<CrudSchema[]>([
    {
      label: t('sys.mail.account.mail'),
      field: 'mail',
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
      label: t('sys.mail.account.username'),
      field: 'username',
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
      label: t('sys.mail.account.password'),
      field: 'password',
      isTable: false
    },
    {
      label: t('sys.mail.account.host'),
      field: 'host'
    },
    {
      label: t('sys.mail.account.port'),
      field: 'port',
      form: {
        component: 'InputNumber',
        value: 465
      }
    },
    {
      label: t('sys.mail.account.sslEnable'),
      field: 'sslEnable',
      dictType: DICT_TYPE.INFRA_BOOLEAN_STRING,
      dictClass: 'boolean',
      form: {
        component: 'Radio'
      }
    },
    {
      label: t('sys.mail.account.starttlsEnable'),
      field: 'starttlsEnable',
      dictType: DICT_TYPE.INFRA_BOOLEAN_STRING,
      dictClass: 'boolean',
      form: {
        component: 'Radio'
      }
    },
    {
      label: t('sys.mail.account.createTime'),
      field: 'createTime',
      isForm: false,
      formatter: dateFormatter,
      detail: {
        dateFormat: 'YYYY-MM-DD HH:mm:ss'
      }
    },
    {
      label: t('sys.mail.account.operation'),
      field: 'action',
      isForm: false,
      isDetail: false
    }
  ])
}

export const getSchemas = () => {
  const crudSchemas = getCrudSchemas()
  return useCrudSchemas(crudSchemas)
}
