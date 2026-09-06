import { generateUUID } from '@/utils'
import * as DictDataApi from '@/api/system/dict/dict.type'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import { selectRule } from '@/components/FormCreate/src/config/selectRule'
import { cloneDeep } from 'lodash-es'

/**
 * Dict selector rule. Since it uses dynamic data, it needs its own config and can't reuse useSelectRule
 */
export const useDictSelectRule = () => {
  const label = 'Dict Selector'
  const name = 'DictSelect'
  const rules = cloneDeep(selectRule)
  const dictOptions = ref<{ label: string; value: string }[]>([]) // dict type dropdown options
  onMounted(async () => {
    const data = await DictDataApi.getSimpleDictTypeList()
    if (!data || data.length === 0) {
      return
    }
    dictOptions.value =
      data?.map((item: DictDataApi.DictTypeVO) => ({
        label: item.name,
        value: item.type
      })) ?? []
  })
  return {
    icon: 'icon-doc-text',
    label,
    name,
    rule() {
      return {
        type: name,
        field: generateUUID(),
        title: label,
        info: '',
        $required: false
      }
    },
    props(_, { t }) {
      return localeProps(t, name + '.props', [
        makeRequiredRule(),
        {
          type: 'select',
          field: 'dictType',
          title: 'Dict Type',
          value: '',
          options: dictOptions.value
        },
        {
          type: 'select',
          field: 'valueType',
          title: 'Dict Value Type',
          value: 'str',
          options: [
            { label: 'Number', value: 'int' },
            { label: 'String', value: 'str' },
            { label: 'Boolean', value: 'bool' }
          ]
        },
        ...rules
      ])
    }
  }
}
