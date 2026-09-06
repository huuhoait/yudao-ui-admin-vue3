<!-- Web page iframe component (Element Plus version - Vue3) -->
<template>
  <div class="iframe-component">
    <!-- iframe preview -->
    <div v-if="showPreview" class="iframe-preview">
      <iframe
        :src="displayUrl"
        :width="width"
        :height="height"
        :frameborder="frameborder"
        :allowfullscreen="allowfullscreen"
        :loading="loading"
        :sandbox="sandbox || undefined"
        class="iframe-content"
      ></iframe>
    </div>

    <!-- shown when there is no URL or the URL is invalid -->
    <div v-else class="iframe-placeholder">
      <el-empty description="Please configure the URL address in the properties panel on the right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isUrl } from '@/utils/is'

defineOptions({ name: 'IframeComponent' })

interface Props {
  modelValue?: string
  url?: string
  height?: string
  width?: string
  frameborder?: string
  allowfullscreen?: boolean
  loading?: 'eager' | 'lazy'
  sandbox?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  url: '',
  height: '500px',
  width: '100%',
  frameborder: '0',
  allowfullscreen: true,
  loading: 'lazy',
  sandbox: ''
})

const displayUrl = computed(() => props.url || props.modelValue || '') // the URL to display (prefers the url prop, falls back to modelValue)
const showPreview = computed(() => {
  return displayUrl.value && isUrl(displayUrl.value)
}) // whether to show the preview
</script>

<style scoped>
.iframe-component {
  width: 100%;
}

.iframe-preview {
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.iframe-content {
  display: block;
  border: none;
}

.iframe-placeholder {
  display: flex;
  min-height: 200px;
  background-color: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
}
</style>
