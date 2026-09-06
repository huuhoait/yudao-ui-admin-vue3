import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'

/**
 * iframe component rule
 */
export const useIframeRule = () => {
  const label = 'Web Page iframe'
  const name = 'IframeComponent'

  return {
    icon: 'icon-link',
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
          type: 'input',
          field: 'url',
          title: 'URL Address',
          value: '',
          info: 'Please enter a full HTTP or HTTPS address'
        },
        {
          type: 'input',
          field: 'height',
          title: 'iframe Height',
          value: '500px',
          info: 'Supports units such as px, %, vh'
        },
        {
          type: 'input',
          field: 'width',
          title: 'iframe Width',
          value: '100%',
          info: 'Supports units such as px, %, vw'
        },
        {
          type: 'select',
          field: 'loading',
          title: 'Loading Method',
          value: 'lazy',
          options: [
            { label: 'Lazy Load', value: 'lazy' },
            { label: 'Eager Load', value: 'eager' }
          ]
        },
        {
          type: 'switch',
          field: 'allowfullscreen',
          title: 'Allow Fullscreen',
          value: true
        },
        {
          type: 'input',
          field: 'sandbox',
          title: 'sandbox Attribute',
          value: '',
          info: 'Security sandbox restriction, e.g. allow-scripts allow-same-origin'
        }
      ])
    }
  }
}
