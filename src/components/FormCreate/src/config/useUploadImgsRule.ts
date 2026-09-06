import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'

export const useUploadImgsRule = () => {
  const label = 'Multiple Image Upload'
  const name = 'UploadImgs'
  return {
    icon: 'icon-upload',
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
          type: 'switch',
          field: 'drag',
          title: 'Drag and Drop Upload',
          value: false
        },
        {
          type: 'select',
          field: 'fileType',
          title: 'Image Type Restriction',
          value: ['image/jpeg', 'image/png', 'image/gif'],
          options: [
            { label: 'image/apng', value: 'image/apng' },
            { label: 'image/bmp', value: 'image/bmp' },
            { label: 'image/gif', value: 'image/gif' },
            { label: 'image/jpeg', value: 'image/jpeg' },
            { label: 'image/pjpeg', value: 'image/pjpeg' },
            { label: 'image/svg+xml', value: 'image/svg+xml' },
            { label: 'image/tiff', value: 'image/tiff' },
            { label: 'image/webp', value: 'image/webp' },
            { label: 'image/x-icon', value: 'image/x-icon' }
          ],
          props: {
            multiple: true
          }
        },
        {
          type: 'inputNumber',
          field: 'fileSize',
          title: 'Size Limit (MB)',
          value: 5,
          props: { min: 0 }
        },
        {
          type: 'inputNumber',
          field: 'limit',
          title: 'Quantity Limit',
          value: 5,
          props: { min: 0 }
        },
        {
          type: 'input',
          field: 'height',
          title: 'Component Height',
          value: '150px'
        },
        {
          type: 'input',
          field: 'width',
          title: 'Component Width',
          value: '150px'
        },
        {
          type: 'input',
          field: 'borderradius',
          title: 'Component Border Radius',
          value: '8px'
        }
      ])
    }
  }
}
