<template>
  <doc-alert :title="t('infra.webSocket.doc.title')" url="https://doc.iocoder.cn/websocket/" />

  <div class="flex">
    <!-- 左侧：建立连接、发送消息 -->
    <el-card :gutter="12" class="w-1/2" shadow="always">
      <template #header>
        <div class="card-header">
          <span>{{ t('infra.webSocket.connection.title') }}</span>
        </div>
      </template>
      <div class="flex items-center">
        <span class="mr-4 text-lg font-medium">
          {{ t('infra.webSocket.connection.statusLabel') }}
        </span>
        <el-tag :color="getTagColor">{{ status }}</el-tag>
      </div>
      <hr class="my-4" />
      <div class="flex">
        <el-input v-model="server" disabled>
          <template #prepend>{{ t('infra.webSocket.connection.serverLabel') }}</template>
        </el-input>
        <el-button :type="getIsOpen ? 'danger' : 'primary'" @click="toggleConnectStatus">
          {{
            getIsOpen
              ? t('infra.webSocket.actions.close')
              : t('infra.webSocket.actions.open')
          }}
        </el-button>
      </div>
      <p class="mt-4 text-lg font-medium">{{ t('infra.webSocket.labels.messageInput') }}</p>
      <hr class="my-4" />
      <el-input
        v-model="sendText"
        :autosize="{ minRows: 2, maxRows: 4 }"
        :disabled="!getIsOpen"
        clearable
        :placeholder="t('infra.webSocket.placeholders.message')"
        type="textarea"
      />
      <el-select
        v-model="sendUserId"
        class="mt-4"
        :placeholder="t('infra.webSocket.placeholders.user')"
      >
        <el-option key="" :label="t('infra.webSocket.options.all')" value="" />
        <el-option
          v-for="user in userList"
          :key="user.id"
          :label="user.nickname"
          :value="user.id"
        />
      </el-select>
      <el-button
        :disabled="!getIsOpen"
        block
        class="ml-2 mt-4"
        type="primary"
        @click="handlerSend"
      >
        {{ t('infra.webSocket.actions.send') }}
      </el-button>
    </el-card>
    <!-- 右侧：消息记录 -->
    <el-card :gutter="12" class="w-1/2" shadow="always">
      <template #header>
        <div class="card-header">
          <span>{{ t('infra.webSocket.labels.messageLog') }}</span>
        </div>
      </template>
      <div class="max-h-80 overflow-auto">
        <ul>
          <li v-for="msg in messageReverseList" :key="msg.time" class="mt-2">
            <div class="flex items-center">
              <span class="text-primary mr-2 font-medium">
                {{ t('infra.webSocket.labels.received') }}
              </span>
              <span>{{ formatDate(msg.time) }}</span>
            </div>
            <div>
              {{ msg.text }}
            </div>
          </li>
        </ul>
      </div>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { useWebSocket } from '@vueuse/core'
import { getRefreshToken } from '@/utils/auth'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'InfraWebSocket' })

const { t } = useI18n()
const message = useMessage() // 消息弹窗

const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken() // 使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：WebSocket 无法方便的刷新访问令牌
) // WebSocket 服务地址
const getIsOpen = computed(() => status.value === 'OPEN') // WebSocket 连接是否打开
const getTagColor = computed(() => (getIsOpen.value ? 'success' : 'red')) // WebSocket 连接的展示颜色

/** 发起 WebSocket 连接 */
const { status, data, send, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})

/** 监听接收到的数据 */
const messageList = ref([] as { time: number; text: string }[]) // 消息列表
const messageReverseList = computed(() => messageList.value.slice().reverse())
watchEffect(() => {
  if (!data.value) {
    return
  }
  try {
    // 1. 收到心跳
    if (data.value === 'pong') {
      // state.recordList.push({
      //   text: '【心跳】',
      //   time: new Date().getTime()
      // })
      return
    }

    // 2.1 解析 type 消息类型
    const jsonMessage = JSON.parse(data.value)
    const type = jsonMessage.type
    const content = JSON.parse(jsonMessage.content)
    if (!type) {
      message.error(t('infra.webSocket.errors.unknownType', { value: data.value }))
      return
    }
    // 2.2 消息类型：demo-message-receive
    if (type === 'demo-message-receive') {
      const single = content.single
      if (single) {
        messageList.value.push({
          text: t('infra.webSocket.log.receiveSingle', {
            userId: content.fromUserId,
            text: content.text
          }),
          time: new Date().getTime()
        })
      } else {
        messageList.value.push({
          text: t('infra.webSocket.log.receiveGroup', {
            userId: content.fromUserId,
            text: content.text
          }),
          time: new Date().getTime()
        })
      }
      return
    }
    // 2.3 消息类型：notice-push
    if (type === 'notice-push') {
      messageList.value.push({
        text: t('infra.webSocket.log.receiveSystem', { title: content.title }),
        time: new Date().getTime()
      })
      return
    }
    message.error(t('infra.webSocket.errors.unhandled', { value: data.value }))
  } catch (error) {
    message.error(t('infra.webSocket.errors.process', { value: data.value }))
    console.error(error)
  }
})

/** 发送消息 */
const sendText = ref('') // 发送内容
const sendUserId = ref('') // 发送人
const handlerSend = () => {
  // 1.1 先 JSON 化 message 消息内容
  const messageContent = JSON.stringify({
    text: sendText.value,
    toUserId: sendUserId.value
  })
  // 1.2 再 JSON 化整个消息
  const jsonMessage = JSON.stringify({
    type: 'demo-message-send',
    content: messageContent
  })
  // 2. 最后发送消息
  send(jsonMessage)
  sendText.value = ''
}

/** 切换 websocket 连接状态 */
const toggleConnectStatus = () => {
  if (getIsOpen.value) {
    close()
  } else {
    open()
  }
}

/** 初始化 **/
const userList = ref<any[]>([]) // 用户列表
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
