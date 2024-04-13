<template>
  <div class="relative h-full">
    <section class="flex items-center gap-4 mb-4">
      <PrButton
        class="gap-1"
        :disabled="mediaSource === 'video' && !hasVideoFile"
        @click="tuggleCamera"
      >
        <i class="pi" :class="workflowStage === 'running' ? 'pi-pause' : 'pi-caret-right'" />
        <span>
          {{ workflowStage === 'running' ? (mediaSource === 'camera' ? '停止' : '暂停') : '开始' }}
        </span>
      </PrButton>
      <PrButton class="gap-1" @click="tuggleLandmarks">
        <i class="pi" :class="showLandmarks ? 'pi-eye-slash' : 'pi-eye'" />
        <span> {{ showLandmarks ? '隐藏' : '显示' }}标记 </span>
      </PrButton>

      <PrDropdown
        v-model="humanModel"
        class="cursor-pointer w-[200px]"
        :options="PresetModelList"
        option-label="name"
        :disabled="workflowStage !== 'unInit'"
      >
        <template #value="slotProps">
          <div class="flex items-center">
            <img
              class="h-6 mr-2 rounded-md overflow-hidden"
              :alt="slotProps.value.name"
              :src="slotProps.value.cover"
            />
            <div>{{ slotProps.value.name }}</div>
          </div>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <img
              class="h-4 mr-2 rounded-sm overflow-hidden"
              :alt="slotProps.option.name"
              :src="slotProps.option.cover"
            />
            <div>{{ slotProps.option.name }}</div>
          </div>
        </template>
      </PrDropdown>

      <PrDropdown
        v-model="mediaSource"
        :options="[
          { label: '摄像头', value: 'camera' },
          { label: '视频', value: 'video' }
        ]"
        option-label="label"
        option-value="value"
        class="w-[120px]"
        :disabled="workflowStage !== 'unInit'"
        @change="changeMediaSource"
      />

      <PrFileUpload
        v-if="mediaSource === 'video'"
        custom-upload
        accept="video/*"
        mode="basic"
        choose-label="选择视频文件"
        @select="handelVideoSelect"
        @clear="handelVideoDelete"
      />
    </section>
    <section ref="container" class="grid grid-cols-2 gap-2 relative">
      <div ref="avatarContainer" />
      <video ref="videoElement" class="bg-gray-500 object-cover" loop />
      <canvas ref="sourceCanvas" class="absolute right-0 top-0"></canvas>
    </section>

    <div ref="controlsElement" />
  </div>
  <Teleport v-if="workflowStage === 'loading'" to="body">
    <div class="absolute bg-[rgba(0,0,0,0.5)] inset-0 flex flex-col items-center justify-center">
      <PrProgressSpinner stroke-width="6" />
      <span class="text-white mt-4 text-lg animate-pulse">模型加载中...</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { PresetModelList } from '@renderer/common/modelConfig'
import { useThrottleFn } from '@vueuse/core'
import { Avatar } from '@renderer/common/three/Avatar'
import { Stream } from '@renderer/common/stream'
import type { StreamType } from '@renderer/common/stream'
import { Holistic } from '@renderer/common/holistic/Holistic'

// DOM 元素
const videoElement = ref<HTMLVideoElement | null>(null)
const avatarContainer = ref<HTMLCanvasElement | null>(null)
const sourceCanvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const controlsElement = ref<HTMLDivElement | null>(null)
// 状态值
const showLandmarks = ref(true)
const workflowStage = ref<'unInit' | 'loading' | 'running' | 'pause'>('unInit')
const mediaSource = ref<StreamType>('camera')
const humanModel = ref(PresetModelList[0])
const hasVideoFile = ref<boolean>(false)

// 处理窗口大小变化
function handelResize() {
  const width = (container.value!.clientWidth - 8) / 2
  const height = width / Stream.CAMERA_RATIO

  avatarContainer.value!.style.width = `${width}px`
  avatarContainer.value!.style.height = `${height}px`
  videoElement.value!.style.width = `${width}px`
  videoElement.value!.style.height = `${height}px`
  sourceCanvas.value!.width = width
  sourceCanvas.value!.height = height

  return {
    width,
    height
  }
}

// 显示/隐藏标记
function tuggleLandmarks() {
  showLandmarks.value = !showLandmarks.value
  showLandmarks.value
    ? sourceCanvas.value!.classList.remove('hidden')
    : sourceCanvas.value!.classList.add('hidden')
}

// 选择视频文件
function handelVideoSelect(e) {
  const file = e.files[0]
  if (!file) return
  hasVideoFile.value = true
  const url = URL.createObjectURL(file)
  videoElement.value!.src = url
}

// 删除视频文件
function handelVideoDelete() {
  hasVideoFile.value = false
  workflowStage.value = 'unInit'
  videoElement.value!.src = ''
  holistic.clearLandMarks()
}

// 切换媒体源
function changeMediaSource() {
  holistic.reset()
  stream.setStream(mediaSource.value)
}

// 开启/关闭摄像头
async function tuggleCamera() {
  switch (workflowStage.value) {
    case 'running':
      if (mediaSource.value === 'camera') {
        workflowStage.value = 'unInit'
        holistic.clearLandMarks()
        // avatar.clear() 后续更换为 reset 姿态而不是清空
      } else workflowStage.value = 'pause'
      stream.stop()
      break
    case 'unInit':
      workflowStage.value = 'loading'
      await holistic.initialize()
    // eslint-disable-next-line no-fallthrough
    case 'pause':
      await stream.start()
      workflowStage.value = 'running'
      break
  }
}

// 初始化人物模型
let avatar: Avatar
let onResize: () => void
function initAvatar(container: HTMLCanvasElement) {
  avatar = new Avatar(container)
  onResize = useThrottleFn(() => {
    const { width, height } = handelResize()
    avatar.setSize(width, height)
  }, 100)
  window.addEventListener('resize', onResize)
  avatar.start()
  watch(
    humanModel,
    (value) => {
      avatar.loadModel(value.path)
    },
    {
      immediate: true
    }
  )
}

// 初始化视频流
let stream: Stream
function initStream(videoElement: HTMLVideoElement) {
  stream = new Stream(videoElement, holistic)
}

// 初始化姿态检测
let holistic: Holistic
function initHolistic() {
  holistic = new Holistic(sourceCanvas.value!)
}

onMounted(() => {
  handelResize()
  initHolistic() // 先初始化姿态检测，下面的初始化需要用到
  initStream(videoElement.value!)
  initAvatar(avatarContainer.value!)
})

onUnmounted(() => {
  stream.stop()
  avatar.dispose()
  holistic.close()
  window.removeEventListener('resize', onResize)
})
</script>
