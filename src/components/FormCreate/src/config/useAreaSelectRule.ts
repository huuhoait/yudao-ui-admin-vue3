import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import { AreaLevelEnum } from '@/utils/constants'

/**
 * Province/City/District selector rule
 */
export const useAreaSelectRule = () => {
  const label = 'Province/City/District Selector'
  const name = 'AreaSelect'

  return {
    icon: 'icon-location',
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
          field: 'level',
          title: 'Selection Level',
          value: AreaLevelEnum.DISTRICT,
          options: [
            { label: 'Province', value: AreaLevelEnum.PROVINCE },
            { label: 'Province/City', value: AreaLevelEnum.CITY },
            { label: 'Province/City/District', value: AreaLevelEnum.DISTRICT }
          ],
          info: 'Restrict the selectable region level'
        },
        {
          type: 'input',
          field: 'placeholder',
          title: 'Placeholder',
          value: 'Please select province/city/district'
        },
        {
          type: 'switch',
          field: 'clearable',
          title: 'Clearable',
          value: true
        },
        {
          type: 'switch',
          field: 'showAllLevels',
          title: 'Show Full Path',
          value: true,
          info: 'Whether to show the full path of the selected value in the input'
        },
        {
          type: 'input',
          field: 'separator',
          title: 'Separator',
          value: '/',
          info: 'Separator between options'
        },
        {
          type: 'switch',
          field: 'disabled',
          title: 'Disabled',
          value: false
        }
      ])
    }
  }
}
