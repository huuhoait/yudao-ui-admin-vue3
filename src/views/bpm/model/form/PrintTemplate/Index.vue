<script setup lang="ts">
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { IDomEditor } from '@wangeditor/editor'
import { useI18n } from 'vue-i18n'
import MentionModal from './MentionModal.vue'

const emit = defineEmits(['confirm'])
const { t } = useI18n() // 国际化

// @mention 相关
const isShowModal = ref(false)
const showModal = () => {
  isShowModal.value = true
}
const hideModal = () => {
  isShowModal.value = false
}
const insertMention = (id: any, name: any) => {
  const mentionNode = {
    type: 'mention',
    value: name,
    info: { id },
    children: [{ text: '' }]
  }
  const editor = editorRef.value
  if (editor) {
    editor.restoreSelection()
    editor.deleteBackward('character')
    editor.insertNode(mentionNode)
    editor.move(1)
  }
}

// Dialog 相关
const dialogVisible = ref(false)
const open = async (template: string) => {
  dialogVisible.value = true
  valueHtml.value = template
}
defineExpose({ open })
const handleConfirm = () => {
  emit('confirm', valueHtml.value)
  dialogVisible.value = false
}

// Editor 相关
const editorRef = shallowRef<IDomEditor>()
const editorId = ref('wangeEditor-1')
const toolbarConfig = {
  excludeKeys: ['group-video'],
  insertKeys: {
    index: 31,
    keys: ['ProcessRecordMenu']
  }
}
const editorConfig = computed(() => ({
  placeholder: t('bpm.model.form.printTemplate.placeholder'),
  EXTEND_CONF: {
    mentionConfig: {
      showModal,
      hideModal
    }
  }
}))
const valueHtml = ref()
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

/** 初始化 */
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) {
    return
  }
  editor.destroy()
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('bpm.model.form.printTemplate.dialogTitle')"
    fullscreen
  >
    <div style="margin: 0 10px">
      <el-alert
        :title="t('bpm.model.form.printTemplate.mentionTip')"
        type="info"
        show-icon
        :closable="false"
      />
    </div>
    <!-- TODO @unocss 简化 style -->
    <div style="border: 1px solid #ccc; margin: 10px">
      <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editorRef"
        :editorId="editorId"
        :defaultConfig="toolbarConfig"
      />
      <Editor
        style="height: 500px; overflow-y: hidden"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :editorId="editorId"
        @on-created="handleCreated"
      />
      <MentionModal
        v-if="isShowModal"
        @hide-mention-modal="hideModal"
        @insert-mention="insertMention"
      />
    </div>
    <div style="margin-right: 10px; float: right">
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleConfirm">{{ t('common.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>

<style src="@wangeditor/editor/dist/css/style.css"></style>
