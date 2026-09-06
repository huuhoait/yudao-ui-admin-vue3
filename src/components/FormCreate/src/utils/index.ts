export function makeRequiredRule() {
  return {
    type: 'Required',
    field: 'formCreate$required',
    title: 'Required'
  }
}

export const localeProps = (t, prefix, rules) => {
  return rules.map((rule) => {
    if (rule.field === 'formCreate$required') {
      rule.title = t('props.required') || rule.title
    } else if (rule.field && rule.field !== '_optionType') {
      rule.title = t('components.' + prefix + '.' + rule.field) || rule.title
    }
    return rule
  })
}

/**
 * Parse a form component's field/title etc. (recursive, for components with children)
 *
 * @param rule  the component's generation rule https://www.form-create.com/v3/guide/rule
 * @param fields  the parsed form component fields
 * @param parentTitle  if this is a sub-form, its title; empty by default
 */
export const parseFormFields = (
  rule: Record<string, any>,
  fields: Array<Record<string, any>> = [],
  parentTitle: string = ''
) => {
  const { type, field, $required, title: tempTitle, children } = rule
  if (field && tempTitle) {
    let title = tempTitle
    if (parentTitle) {
      title = `${parentTitle}.${tempTitle}`
    }
    let required = false
    if ($required) {
      required = true
    }
    fields.push({
      field,
      title,
      type,
      required
    })
    // TODO sub-form: need to handle sub-form fields
    // if (type === 'group' && rule.props?.rule && Array.isArray(rule.props.rule)) {
    //   // parse sub-form fields
    //   rule.props.rule.forEach((item) => {
    //     parseFields(item, fieldsPermission, title)
    //   })
    // }
  }
  if (children && Array.isArray(children)) {
    children.forEach((rule) => {
      parseFormFields(rule, fields)
    })
  }
}
