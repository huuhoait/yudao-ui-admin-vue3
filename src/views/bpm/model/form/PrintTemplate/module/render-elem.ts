import { h, VNode } from 'snabbdom'
import { DomEditor, IDomEditor, SlateElement } from '@wangeditor-next/editor'

function renderProcessRecord(
  elem: SlateElement,
  _children: VNode[] | null,
  editor: IDomEditor
): VNode {
  const selected = DomEditor.isNodeSelected(editor, elem)

  return h(
    'table',
    {
      props: {
        contentEditable: false
      },
      style: {
        width: '100%',
        border: selected ? '2px solid var(--w-e-textarea-selected-border-color)' : ''
      }
    },
    [
      h('thead', [h('tr', [h('th', { attrs: { colSpan: 3 } }, t('bpm.model.form.PrintTemplate.module._todo124'))])]),
      h('tbody', [
        h('tr', [
          h('td', [
            h(
              'span',
              {
                props: {
                  contentEditable: false
                },
                style: {
                  marginLeft: '3px',
                  marginRight: '3px',
                  backgroundColor: 'var(--w-e-textarea-slight-bg-color)',
                  borderRadius: '3px',
                  padding: '0 3px'
                }
              },
              t('bpm.model.form.PrintTemplate.module._todo125')
            )
          ]),
          h('td', [
            h(
              'span',
              {
                props: {
                  contentEditable: false
                },
                style: {
                  marginLeft: '3px',
                  marginRight: '3px',
                  backgroundColor: 'var(--w-e-textarea-slight-bg-color)',
                  borderRadius: '3px',
                  padding: '0 3px'
                }
              },
              t('bpm.model.form.PrintTemplate.module.action')
            )
          ])
        ])
      ])
    ]
  )
}

const conf = {
  type: 'process-record',
  renderElem: renderProcessRecord
}

export default conf
