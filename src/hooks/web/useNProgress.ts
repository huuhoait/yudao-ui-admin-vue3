import { useCssVar } from '@vueuse/core'
import type { NProgressOptions } from 'nprogress'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { nextTick } from 'vue'

const primaryColor = useCssVar('--el-color-primary', document.documentElement)

export const useNProgress = () => {
  NProgress.configure({ showSpinner: false } as NProgressOptions)

  const initColor = async () => {
    await nextTick()
    const bar = document
      .getElementById('nprogress')
      ?.getElementsByClassName('bar')[0] as HTMLElement
    if (bar && primaryColor.value) {
      bar.style.background = primaryColor.value
    }
  }

  initColor()

  const start = () => {
    NProgress.start()
  }

  const done = () => {
    NProgress.done()
  }

  return {
    start,
    done
  }
}
