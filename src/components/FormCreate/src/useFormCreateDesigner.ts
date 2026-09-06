import {
  useDictSelectRule,
  useEditorRule,
  useSelectRule,
  useUploadFileRule,
  useUploadImgRule,
  useUploadImgsRule,
  useIframeRule,
  useAreaSelectRule
} from './config'
import { Ref } from 'vue'
import { Menu } from '@/components/FormCreate/src/type'
import { apiSelectRule } from '@/components/FormCreate/src/config/selectRule'
import { generateUUID } from '@/utils'

/**
 * Form designer enhancement hook
 * Adds
 * - File Upload
 * - Single Image Upload
 * - Multiple Image Upload
 * - Dict Selector
 * - User Selector
 * - Department Selector
 * - Rich Text
 */
export const useFormCreateDesigner = async (designer: Ref) => {
  const editorRule = useEditorRule()
  const uploadFileRule = useUploadFileRule()
  const uploadImgRule = useUploadImgRule()
  const uploadImgsRule = useUploadImgsRule()

  /**
   * Build form components
   */
  const buildFormComponents = () => {
    // remove the built-in upload component rules, use uploadFileRule/uploadImgRule/uploadImgsRule instead
    designer.value?.removeMenuItem('upload')
    // remove the built-in rich-text component rule, use editorRule instead
    designer.value?.removeMenuItem('fcEditor')
    const iframeRule = useIframeRule()
    const areaSelectRule = useAreaSelectRule()
    const components = [
      editorRule,
      uploadFileRule,
      uploadImgRule,
      uploadImgsRule,
      iframeRule,
      areaSelectRule
    ]
    components.forEach((component) => {
      // register the component rule
      designer.value?.addComponent(component)
      // insert the drag button under the `main` category
      designer.value?.appendMenuItem('main', {
        icon: component.icon,
        name: component.name,
        label: component.label
      })
    })
  }

  const userSelectRule = useSelectRule({
    name: 'UserSelect',
    label: 'User Selector',
    icon: 'icon-user-o',
    props: [
      {
        type: 'switch',
        field: 'defaultCurrentUser',
        title: 'Default to current user',
        value: false
      }
    ]
  })
  const deptSelectRule = useSelectRule({
    name: 'DeptSelect',
    label: 'Department Selector',
    icon: 'icon-address-card-o',
    props: [
      {
        type: 'select',
        field: 'returnType',
        title: 'Return Value Type',
        value: 'id',
        options: [
          { label: 'Department ID', value: 'id' },
          { label: 'Department Name', value: 'name' }
        ]
      },
      {
        type: 'switch',
        field: 'defaultCurrentDept',
        title: 'Default to current department',
        value: false
      }
    ]
  })
  const dictSelectRule = useDictSelectRule()
  const apiSelectRule0 = useSelectRule({
    name: 'ApiSelect',
    label: 'API Selector',
    icon: 'icon-server',
    props: [...apiSelectRule],
    event: ['click', 'change', 'visibleChange', 'clear', 'blur', 'focus']
  })

  /**
   * Build the system fields menu
   */
  const buildSystemMenu = () => {
    // remove the built-in dropdown selector components, use currencySelectRule instead
    // designer.value?.removeMenuItem('select')
    // designer.value?.removeMenuItem('radio')
    // designer.value?.removeMenuItem('checkbox')
    const components = [userSelectRule, deptSelectRule, dictSelectRule, apiSelectRule0]
    const menu: Menu = {
      name: 'system',
      title: 'System Fields',
      list: components.map((component) => {
        // register the component rule
        designer.value?.addComponent(component)
        // insert the drag button under the `system` category
        return {
          icon: component.icon,
          name: component.name,
          label: component.label
        }
      })
    }
    designer.value?.addMenu(menu)
  }

  /**
   * Fix duplicate field ID issue
   * When a component is copied, automatically generate a new field ID for the new component
   *
   * See issue: https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ICM22X
   */
  const fixDuplicateFields = () => {
    // get all current rules
    const rules = designer.value?.getRule() || []
    const fieldIds = new Set<string>()
    let hasChanges = false

    // walk all rules, detect and fix duplicate field IDs
    rules.forEach((rule: any) => {
      if (rule.field) {
        if (fieldIds.has(rule.field)) {
          // duplicate found, generate a new ID
          const oldField = rule.field
          const newField = generateUUID()
          console.log(`[FormCreate] Duplicate field ID detected: ${oldField}, auto-updated to: ${newField}`)
          rule.field = newField
          hasChanges = true
        } else {
          fieldIds.add(rule.field)
        }
      }
    })

    // update the designer if any duplicate fields were fixed
    if (hasChanges) {
      designer.value?.setRule(rules)
    }

    return hasChanges
  }

  onMounted(async () => {
    await nextTick()
    buildFormComponents()
    buildSystemMenu()

    // watch designer content changes, auto-fix duplicate field IDs
    let isFixing = false // prevent infinite loop
    watch(
      () => designer.value?.getRule(),
      async () => {
        if (!isFixing) {
          isFixing = true
          await nextTick()
          fixDuplicateFields()
          isFixing = false
        }
      },
      { deep: true }
    )
  })
}
