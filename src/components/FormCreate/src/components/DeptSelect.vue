<!-- Department selector - tree view -->
<template>
  <el-tree-select
    v-model="selectedValue"
    class="w-1/1"
    :data="deptTree"
    :props="treeProps"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="placeholder || 'Please select department'"
    :check-strictly="true"
    :filterable="true"
    :filter-node-method="filterNode"
    :clearable="true"
    :render-after-expand="false"
    node-key="id"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import { getSimpleDeptList, type DeptVO } from '@/api/system/dept'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'DeptSelect' })

// props accepted from the parent component
interface Props {
  modelValue?: number | string | number[] | string[]
  multiple?: boolean
  returnType?: 'id' | 'name'
  defaultCurrentDept?: boolean
  disabled?: boolean
  placeholder?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  returnType: 'id',
  defaultCurrentDept: false,
  disabled: false,
  placeholder: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string | number[] | string[] | undefined): void
}>()

// tree selector config
const treeProps = {
  label: 'name',
  value: 'id',
  children: 'children'
}

// department tree data
const deptTree = ref<any[]>([])
// raw department list (used to look up names when returnType='name')
const deptList = ref<DeptVO[]>([])
// current selected value
const selectedValue = ref<number | string | number[] | string[] | undefined>()

// load the department tree data
const loadDeptTree = async () => {
  try {
    const data = await getSimpleDeptList()
    deptList.value = data
    deptTree.value = handleTree(data)
  } catch (error) {
    console.warn('Failed to load department data:', error)
    deptTree.value = []
  }
}

// get department name by ID
const getDeptNameById = (id: number): string | undefined => {
  const dept = deptList.value.find((item) => item.id === id)
  return dept?.name
}

// get department ID by name
const getDeptIdByName = (name: string): number | undefined => {
  const dept = deptList.value.find((item) => item.name === name)
  return dept?.id
}

// handle selected value change
const handleChange = (value: number | number[] | undefined) => {
  if (value === undefined || value === null) {
    emit('update:modelValue', props.multiple ? [] : undefined)
    return
  }

  // decide the return value type based on returnType
  if (props.returnType === 'name') {
    if (props.multiple && Array.isArray(value)) {
      const names = value.map((id) => getDeptNameById(id)).filter(Boolean) as string[]
      emit('update:modelValue', names)
    } else if (!props.multiple && typeof value === 'number') {
      const name = getDeptNameById(value)
      emit('update:modelValue', name)
    }
  } else {
    emit('update:modelValue', value)
  }
}

// tree node filter method (supports search filtering)
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.includes(value)
}

// watch modelValue changes, sync to the internal selected value
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === undefined || newValue === null) {
      selectedValue.value = props.multiple ? [] : undefined
      return
    }

    // if returnType is 'name', convert the name to an ID for the tree selector to display
    if (props.returnType === 'name') {
      if (props.multiple && Array.isArray(newValue)) {
        const ids = (newValue as string[])
          .map((name) => getDeptIdByName(name))
          .filter(Boolean) as number[]
        selectedValue.value = ids
      } else if (!props.multiple && typeof newValue === 'string') {
        const id = getDeptIdByName(newValue)
        selectedValue.value = id
      }
    } else {
      selectedValue.value = newValue as number | number[]
    }
  },
  { immediate: true }
)

// check whether there's a valid preset value
const hasValidPresetValue = (): boolean => {
  const value = props.modelValue
  if (value === undefined || value === null || value === '') {
    return false
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return true
}

// whether we're inside the form designer: FcDesigner provides 'designer' to its child components; runtime forms don't have this injection
const designerCtx = inject('designer', null)

// set the default value (current user's department)
const setDefaultValue = () => {
  // only handle this when defaultCurrentDept is true
  if (!props.defaultCurrentDept) return

  // don't set a dynamic default value inside the form designer: otherwise the emitted value gets
  // written back into rule.value by the designer's two-way binding, and once the form design is
  // persisted, other users at runtime would get this baked-in fixed value, so the default
  // department would stop following the currently logged-in user.
  // Only set it at "runtime" — though this means the default value won't show up in the designer preview.
  if (designerCtx !== null) return

  // keep an existing preset value (higher priority than the default current department):
  // preserves the actual value the initiator filled in when re-displaying an approval
  if (hasValidPresetValue()) return

  // get the current user's department ID
  const userStore = useUserStoreWithOut()
  const user = userStore.getUser
  const deptId = user?.deptId

  // handle the edge case where deptId is empty or 0
  if (!deptId || deptId === 0) return

  // decide the default value format based on multiple mode
  const defaultValue = props.multiple ? [deptId] : deptId
  emit('update:modelValue', defaultValue)
}

// load data and set the default value when the component is mounted
onMounted(async () => {
  await loadDeptTree()
  // set the default value once data has loaded
  setDefaultValue()
})
</script>
