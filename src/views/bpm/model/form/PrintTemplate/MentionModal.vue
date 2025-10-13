<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['hideMentionModal', 'insertMention'])
const { t } = useI18n() // 国际化

const inputRef = ref()
const top = ref('')
const left = ref('')
const searchVal = ref('')
const formFields = inject<any>('formFieldsObj')
const baseMentionList = computed(() => [
  { id: 'startUser', name: t('bpm.model.form.printTemplate.option.startUser') },
  { id: 'startUserDept', name: t('bpm.model.form.printTemplate.option.startUserDept') },
  { id: 'processName', name: t('bpm.model.form.printTemplate.option.processName') },
  { id: 'processNum', name: t('bpm.model.form.printTemplate.option.processNum') },
  { id: 'startTime', name: t('bpm.model.form.printTemplate.option.startTime') },
  { id: 'endTime', name: t('bpm.model.form.printTemplate.option.endTime') },
  { id: 'processStatus', name: t('bpm.model.form.printTemplate.option.processStatus') },
  { id: 'printUser', name: t('bpm.model.form.printTemplate.option.printUser') },
  { id: 'printTime', name: t('bpm.model.form.printTemplate.option.printTime') }
])
const dynamicMentionList = computed(() => {
  const fields = formFields?.value || []
  return fields.map((item) => ({
    name: `${t('bpm.model.form.printTemplate.formFieldPrefix')}${item.title}`,
    id: item.field
  }))
})
const mentionList = computed(() => [...baseMentionList.value, ...dynamicMentionList.value])
const searchedList = computed(() => {
  const searchValStr = searchVal.value.trim().toLowerCase()
  return mentionList.value.filter((item) => {
    const name = item.name.toLowerCase()
    return name.indexOf(searchValStr) >= 0
  })
})
const inputKeyupHandler = (event: any) => {
  if (event.key === 'Escape') {
    emit('hideMentionModal')
  }
  if (event.key === 'Enter') {
    const firstOne = searchedList.value[0]
    if (firstOne) {
      const { id, name } = firstOne
      insertMentionHandler(id, name)
    }
  }
}
const insertMentionHandler = (id: any, name: any) => {
  emit('insertMention', id, name)
  emit('hideMentionModal')
}

onMounted(() => {
  const domSelection = document.getSelection()
  const domRange = domSelection?.getRangeAt(0)
  if (domRange == null) return
  const rect = domRange.getBoundingClientRect()

  top.value = `${rect.top + 20}px`
  left.value = `${rect.left + 5}px`

  inputRef.value.focus()
})
</script>

<template>
  <div id="mention-modal" :style="{ top: top, left: left }">
    <!-- TODO @lesan：css 可以用 unocss 哇？ -->
    <input id="mention-input" v-model="searchVal" ref="inputRef" @keyup="inputKeyupHandler" />
    <ul id="mention-list">
      <li
        v-for="item in searchedList"
        :key="item.id"
        @click="insertMentionHandler(item.id, item.name)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<style>
#mention-modal {
  position: absolute;
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 5px;
}

#mention-modal input {
  width: 100px;
  outline: none;
}

#mention-modal ul {
  padding: 0;
  margin: 0;
}

#mention-modal ul li {
  list-style: none;
  cursor: pointer;
  padding: 3px 0;
  text-align: left;
}

#mention-modal ul li:hover {
  text-decoration: underline;
}
</style>
