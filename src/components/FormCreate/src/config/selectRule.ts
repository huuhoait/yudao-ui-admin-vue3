const selectRule = [
  {
    type: 'select',
    field: 'selectType',
    title: 'Selector Type',
    value: 'select',
    options: [
      { label: 'Dropdown', value: 'select' },
      { label: 'Radio', value: 'radio' },
      { label: 'Checkbox', value: 'checkbox' }
    ],
    // See https://www.form-create.com/v3/guide/control component linkage — radio and checkbox don't need the multiple-select property
    control: [
      {
        value: 'select',
        condition: '==',
        method: 'hidden',
        rule: [
          'multiple',
          'clearable',
          'collapseTags',
          'multipleLimit',
          'allowCreate',
          'filterable',
          'noMatchText',
          'remote',
          'remoteMethod',
          'reserveKeyword',
          'defaultFirstOption',
          'automaticDropdown'
        ]
      }
    ]
  },
  {
    type: 'switch',
    field: 'filterable',
    title: 'Searchable'
  },
  { type: 'switch', field: 'multiple', title: 'Multiple' },
  {
    type: 'switch',
    field: 'disabled',
    title: 'Disabled'
  },
  { type: 'switch', field: 'clearable', title: 'Clearable' },
  {
    type: 'switch',
    field: 'collapseTags',
    title: 'Show selected values as text tags when multiple'
  },
  {
    type: 'inputNumber',
    field: 'multipleLimit',
    title: 'Max number of items selectable when multiple; 0 means unlimited',
    props: { min: 0 }
  },
  {
    type: 'input',
    field: 'autocomplete',
    title: 'autocomplete Attribute'
  },
  { type: 'input', field: 'placeholder', title: 'Placeholder' },
  { type: 'switch', field: 'allowCreate', title: 'Allow creating new entries' },
  {
    type: 'input',
    field: 'noMatchText',
    title: 'Text shown when no search results match'
  },
  { type: 'input', field: 'noDataText', title: 'Text shown when options are empty' },
  {
    type: 'switch',
    field: 'reserveKeyword',
    title: 'When multiple and searchable, keep the current search keyword after selecting an option'
  },
  {
    type: 'switch',
    field: 'defaultFirstOption',
    title: 'Press Enter in the input to select the first matching item'
  },
  {
    type: 'switch',
    field: 'popperAppendToBody',
    title: 'Append popup to the body element',
    value: true
  },
  {
    type: 'switch',
    field: 'automaticDropdown',
    title: 'For a non-searchable Select, auto-open the options menu when the input gains focus'
  }
]

const apiSelectRule = [
  {
    type: 'input',
    field: 'url',
    title: 'URL Address',
    props: {
      placeholder: '/system/user/simple-list'
    }
  },
  {
    type: 'select',
    field: 'method',
    title: 'Request Method',
    value: 'GET',
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' }
    ],
    control: [
      {
        value: 'GET',
        condition: '!=',
        method: 'hidden',
        rule: [
          {
            type: 'input',
            field: 'data',
            title: 'Request Params (JSON format)',
            props: {
              autosize: true,
              type: 'textarea',
              placeholder: '{"type": 1}'
            }
          }
        ]
      }
    ]
  },
  {
    type: 'input',
    field: 'labelField',
    title: 'label Property',
    info: 'You can use an el expression: ${property} to compose complex data, e.g. ${nickname}-${id}',
    props: {
      placeholder: 'nickname'
    }
  },
  {
    type: 'input',
    field: 'valueField',
    title: 'value Property',
    info: 'You can use an el expression: ${property} to compose complex data, e.g. ${nickname}-${id}',
    props: {
      placeholder: 'id'
    }
  },
  {
    type: 'input',
    field: 'parseFunc',
    title: 'Options Parser Function',
    info: `The response data. Write an anonymous function that parses it into the selector's options list
    (data: any)=>{ label: string; value: any }[]`,
    props: {
      autosize: true,
      rows: { minRows: 2, maxRows: 6 },
      type: 'textarea',
      placeholder: `
        function (data) {
            console.log(data)
            return data.list.map(item=> ({label: item.nickname,value: item.id}))
        }`
    }
  },
  {
    type: 'switch',
    field: 'remote',
    info: 'Whether it is searchable',
    title: 'Whether the options are loaded remotely from the server'
  },
  {
    type: 'input',
    field: 'remoteField',
    title: 'Request Parameter',
    info: 'The parameter name carried in the remote request, e.g. name'
  }
]

export { selectRule, apiSelectRule }
