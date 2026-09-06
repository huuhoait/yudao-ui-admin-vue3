import request from '@/config/axios'
import { isEmpty } from '@/utils/is'
import { ApiSelectProps } from '@/components/FormCreate/src/type'
import { jsonParse } from '@/utils'
import { getCurrentUserId } from '@/utils/auth'

export const useApiSelect = (option: ApiSelectProps) => {
  return defineComponent({
    name: option.name,
    props: {
      // 选项标签
      labelField: {
        type: String,
        default: () => option.labelField ?? 'label'
      },
      // 选项的值
      valueField: {
        type: String,
        default: () => option.valueField ?? 'value'
      },
      // api 接口
      url: {
        type: String,
        default: () => option.url ?? ''
      },
      // 请求类型
      method: {
        type: String,
        default: 'GET'
      },
      // 选项解析函数
      parseFunc: {
        type: String,
        default: ''
      },
      // 请求参数
      data: {
        type: String,
        default: ''
      },
      // 选择器类型，下拉框 select、多选框 checkbox、单选框 radio
      selectType: {
        type: String,
        default: 'select'
      },
      // 是否多选
      multiple: {
        type: Boolean,
        default: false
      },
      // 是否远程搜索
      remote: {
        type: Boolean,
        default: false
      },
      // 远程搜索时携带的参数
      remoteField: {
        type: String,
        default: 'label'
      },
      // 返回值类型（用于部门选择器等）：id 返回 ID，name 返回名称
      returnType: {
        type: String,
        default: 'id'
      },
      // 是否默认选中当前用户（仅 UserSelect 使用）
      defaultCurrentUser: {
        type: Boolean,
        default: false
      }
    },
    setup(props, { emit }) {
      const attrs = useAttrs()
      const options = ref<any[]>([]) // 下拉数据
      const loading = ref(false) // 是否正在从远程获取数据
      const queryParam = ref<any>() // 当前输入的值

      // 检查是否有有效的预设值
      const hasValidPresetValue = (): boolean => {
        const value = attrs.modelValue
        if (value === undefined || value === null || value === '') {
          return false
        }
        if (Array.isArray(value)) {
          return value.length > 0
        }
        return true
      }

      // 设置默认当前用户（仅当 defaultCurrentUser 为 true 且无预设值时）
      const setDefaultCurrentUser = () => {
        // 仅当组件名为 UserSelect 且 defaultCurrentUser 为 true 时处理
        if (option.name !== 'UserSelect' || !props.defaultCurrentUser) {
          return
        }
        // 检查是否已有预设值（预设值优先级高于默认当前用户）
        if (hasValidPresetValue()) {
          return
        }

        // 获取当前用户 ID
        const currentUserId = getCurrentUserId()
        if (currentUserId) {
          // 根据多选/单选模式设置默认值
          const defaultValue = props.multiple ? [currentUserId] : currentUserId
          emit('update:modelValue', defaultValue)
        }
      }

      const getOptions = async () => {
        options.value = []
        // 接口选择器
        if (isEmpty(props.url)) {
          return
        }

        switch (props.method) {
          case 'GET':
            let url: string = props.url
            if (props.remote) {
              if (queryParam.value != undefined) {
                if (url.includes('?')) {
                  url = `${url}&${props.remoteField}=${queryParam.value}`
                } else {
                  url = `${url}?${props.remoteField}=${queryParam.value}`
                }
              }
            }
            parseOptions(await request.get({ url: url }))
            break
          case 'POST':
            const data: any = jsonParse(props.data)
            if (props.remote) {
              data[props.remoteField] = queryParam.value
            }
            parseOptions(await request.post({ url: props.url, data: data }))
            break
        }
      }

      function parseOptions(data: any) {
        // Case 1: if a custom parse function is set, prefer it
        if (!isEmpty(props.parseFunc)) {
          options.value = parseFunc()?.(data)
          return
        }
        // Case 2: the response is directly a list
        if (Array.isArray(data)) {
          parseOptions0(data)
          return
        }
        // Case 2: the response is paginated data, try reading `list`
        data = data.list
        if (!!data && Array.isArray(data)) {
          parseOptions0(data)
          return
        }
        // Case 3: not a standard yudao-vue-pro response
        console.warn(
          `API [${props.url}] response is not a standard yudao-vue-pro response; consider using a custom parse function`
        )
      }

      function parseOptions0(data: any[]) {
        if (Array.isArray(data)) {
          options.value = data.map((item: any) => {
            const label = parseExpression(item, props.labelField)
            let value = parseExpression(item, props.valueField)

            // decide the return value based on returnType
            // if returnType is set to 'name', return the label as the value
            if (props.returnType === 'name') {
              value = label
            }

            return {
              label: label,
              value: value
            }
          })
          return
        }
        console.warn(`API [${props.url}] response is not an array`)
      }

      function parseFunc() {
        let parse: any = null
        if (!!props.parseFunc) {
          // parse the string as a function
          parse = new Function(`return ${props.parseFunc}`)()
        }
        return parse
      }

      function parseExpression(data: any, template: string) {
        // detect whether an expression is used
        if (template.indexOf('${') === -1) {
          return data[template]
        }
        // regex to match ${...} in the template string
        const pattern = /\$\{([^}]*)}/g
        // use replace with the regex and a callback to substitute
        return template.replace(pattern, (_, expr) => {
          // expr is the expression matched inside ${} (a property name here); read it from data
          const result = data[expr.trim()] // trim whitespace in case the user entered a property name with spaces
          if (!result) {
            console.warn(
              `API selector option template [${template}][${expr.trim()}] failed to resolve, result was [${result}]. Check whether this property exists in the API response — if it does, ignore this warning!`
            )
          }
          return result
        })
      }

      const remoteMethod = async (query: any) => {
        if (!query) {
          return
        }
        loading.value = true
        try {
          queryParam.value = query
          await getOptions()
        } finally {
          loading.value = false
        }
      }

      onMounted(async () => {
        await getOptions()
        // 设置默认当前用户（在数据加载完成后）
        setDefaultCurrentUser()
      })

      const buildSelect = () => {
        if (props.multiple) {
          // fix：多写此步是为了解决 multiple 属性问题
          return (
            <el-select
              class="w-1/1"
              multiple
              loading={loading.value}
              {...attrs}
              remote={props.remote}
              {...(props.remote && { remoteMethod: remoteMethod })}
            >
              {options.value.map((item, index) => (
                <el-option key={index} label={item.label} value={item.value} />
              ))}
            </el-select>
          )
        }
        return (
          <el-select
            class="w-1/1"
            loading={loading.value}
            {...attrs}
            remote={props.remote}
            {...(props.remote && { remoteMethod: remoteMethod })}
          >
            {options.value.map((item, index) => (
              <el-option key={index} label={item.label} value={item.value} />
            ))}
          </el-select>
        )
      }
      const buildCheckbox = () => {
        if (isEmpty(options.value)) {
          options.value = [
            { label: 'Option 1', value: 'Option 1' },
            { label: 'Option 2', value: 'Option 2' }
          ]
        }
        return (
          <el-checkbox-group class="w-1/1" {...attrs}>
            {options.value.map((item, index) => (
              <el-checkbox key={index} label={item.label} value={item.value} />
            ))}
          </el-checkbox-group>
        )
      }
      const buildRadio = () => {
        if (isEmpty(options.value)) {
          options.value = [
            { label: 'Option 1', value: 'Option 1' },
            { label: 'Option 2', value: 'Option 2' }
          ]
        }
        return (
          <el-radio-group class="w-1/1" {...attrs}>
            {options.value.map((item, index) => (
              <el-radio key={index} value={item.value}>
                {item.label}
              </el-radio>
            ))}
          </el-radio-group>
        )
      }
      return () => (
        <>
          {props.selectType === 'select'
            ? buildSelect()
            : props.selectType === 'radio'
              ? buildRadio()
              : props.selectType === 'checkbox'
                ? buildCheckbox()
                : buildSelect()}
        </>
      )
    }
  })
}
