<!-- Province/City/District selector (Element Plus version - Vue3) -->
<template>
  <el-cascader
    v-model="selectedValue"
    class="w-full"
    :options="areaTree"
    :props="cascaderProps"
    :disabled="disabled"
    :placeholder="placeholder"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :separator="separator"
    :loading="loading"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { getAreaTree } from '@/api/system/area'
import { AreaLevelEnum } from '@/utils/constants'

defineOptions({ name: 'AreaSelect' })

interface AreaVO {
  id: number
  name: string
  code: string
  parentId?: number
  sort?: number
  status?: number
  children?: AreaVO[]
}

interface Props {
  modelValue?: number[] | string[]
  level?: (typeof AreaLevelEnum)[keyof typeof AreaLevelEnum]
  disabled?: boolean
  placeholder?: string
  clearable?: boolean
  showAllLevels?: boolean
  separator?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  level: AreaLevelEnum.DISTRICT,
  disabled: false,
  placeholder: 'Please select province/city/district',
  clearable: true,
  showAllLevels: true,
  separator: '/'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[] | string[] | undefined): void
}>()

const cascaderProps = {
  label: 'name',
  value: 'id',
  children: 'children',
  checkStrictly: true, // allow selecting any level
  emitPath: true // return the full path
} // Element Plus Cascader props config

const areaTree = ref<AreaVO[]>([]) // area tree data
const selectedValue = ref<number[] | undefined>() // current selected value
const loading = ref(false) // loading state

/** Load the area tree data */
async function loadAreaTree(): Promise<void> {
  try {
    loading.value = true
    const data = await getAreaTree()
    // restrict the level according to `level`
    areaTree.value = filterTreeByLevel(data || [], props.level)
  } catch (error) {
    console.warn('[AreaSelect] Failed to load area data:', error)
    areaTree.value = []
  } finally {
    loading.value = false
  }
}

/** Filter the tree data by level */
function filterTreeByLevel(tree: AreaVO[], maxLevel: number): AreaVO[] {
  if (maxLevel <= 0) {
    return []
  }
  return tree.map((node) => {
    const newNode = { ...node }
    // remove children if this is the last level
    if (maxLevel === 1) {
      delete newNode.children
    } else if (node.children && node.children.length > 0) {
      // recurse into child nodes
      newNode.children = filterTreeByLevel(node.children, maxLevel - 1)
    }
    return newNode
  })
}

/** Handle selected value change */
function handleChange(value: number[] | undefined): void {
  if (value === undefined || value === null) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', value)
}

/** Sync modelValue to the internal selected value */
function syncSelectedValue(): void {
  const newValue = props.modelValue
  if (newValue === undefined || newValue === null) {
    selectedValue.value = undefined
    return
  }

  // ensure it's an array
  if (Array.isArray(newValue)) {
    selectedValue.value = newValue as number[]
  } else {
    selectedValue.value = [newValue as number]
  }
}

/** Watch modelValue changes */
watch(() => props.modelValue, syncSelectedValue, { immediate: true })

/** Load data when the component is mounted */
onMounted(async () => {
  await loadAreaTree()
})
</script>
