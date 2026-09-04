<template>
  <el-dialog v-model="signDialogVisible" :title="t('bpm.processInstance.detail.signature')" width="935">
    <div class="position-relative">
      <Vue3Signature class="b b-solid b-gray" ref="signature" w="900px" h="400px" />
      <el-button
        class="pos-absolute bottom-20px right-10px"
        type="primary"
        text
        size="small"
        @click="signature.clear()"
      >
        <Icon icon="ep:delete" class="mr-5px" />
        {{ t('bpm.processInstance.detail._todo234') }}
      </el-button>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="signDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submit"> {{ t('bpm.processInstance.detail._todo207') }} </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import Vue3Signature from 'vue3-signature'
import * as FileApi from '@/api/infra/file'
import download from '@/utils/download'
const { t } = useI18n() // 国际化

const message = useMessage() // 消息弹窗
const signDialogVisible = ref(false)
const signature = ref()

const open = async () => {
  signDialogVisible.value = true
}
defineExpose({ open })

const emits = defineEmits(['success'])
const submit = async () => {
  message.success(t('bpm.processInstance.detail._todo235'))
  const res = await FileApi.updateFile({
    file: download.base64ToFile(signature.value.save('image/png'), t('bpm.processInstance.detail.signature'))
  })
  emits('success', res.data)
  signDialogVisible.value = false
}
</script>

<style scoped></style>
