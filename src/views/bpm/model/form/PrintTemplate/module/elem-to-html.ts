import { SlateElement } from '@wangeditor-next/editor'
import { i18n } from '@/plugins/vueI18n'

function processRecordToHtml(_elem: SlateElement, _childrenHtml: string): string {
  return `<span data-w-e-type="process-record" data-w-e-is-void data-w-e-is-inline>${i18n.global.t('bpm.model.form.printRecordLabel')}</span>`
}

const conf = {
  type: 'process-record',
  elemToHtml: processRecordToHtml
}

export default conf
