<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PresetModelList } from '@renderer/common/modelConfig'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { Avatar } from '@renderer/common/three/Avatar'
import { Stream, StreamConfig } from '@renderer/common/stream'
import { HolisticMoCap } from '@renderer/common/mocap/HolisticMoCap'
import { DriveModel } from '@renderer/common/mocap/DriveModel'
import SelectModel from '@renderer/components/sideBar/SelectModel.vue'

// DOM 元素
const avatarContainer = ref<HTMLCanvasElement | null>(null)
const videoContainer = ref<HTMLDivElement | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)
const sourceCanvas = ref<HTMLCanvasElement | null>(null)
// 状态值
// const showLandmarks = ref(true)
const workflowStage = ref<'unInit' | 'loading' | 'running' | 'pause'>('unInit')
const humanModel = ref(PresetModelList[0])
const sideBarVisible = ref(false)
const currentSideBar = ref('')
const navVisible = ref(true)
const dialogVisible = ref(false)

const { width, height } = useWindowSize()
const { style } = useDraggable(videoContainer, {
  initialValue: {
    x: width.value - 400 - 10,
    y: height.value / 2 - 225 / 2
  }
})

const menuItems = computed(() => {
  return [
    {
      label: '关于',
      icon: 'pi pi-exclamation-circle',
      command: () => {}
    },
    {
      label: '设置',
      icon: 'pi pi-cog',
      command: () => {}
    },
    {
      label: navVisible.value ? '隐藏控件' : '显示控件',
      icon: navVisible.value ? 'pi pi-eye-slash' : 'pi pi-eye',
      command: () => (navVisible.value = !navVisible.value)
    }
  ]
})

const sideBarsConfig = {
  selectModel: {
    title: '选择模型',
    component: SelectModel
  }
}

// 选择模型
function changeSideBar(type: string) {
  currentSideBar.value = type
  sideBarVisible.value = true
}

// 显示/隐藏标记
// function tuggleLandmarks() {
//   showLandmarks.value = !showLandmarks.value
//   showLandmarks.value
//     ? sourceCanvas.value!.classList.remove('hidden')
//     : sourceCanvas.value!.classList.add('hidden')
// }

function handelCameraClick() {
  if (workflowStage.value === 'running') stopMoCap()
  else dialogVisible.value = true
}

async function startMoCap(config: StreamConfig) {
  dialogVisible.value = false
  workflowStage.value = 'loading'
  await moCap.initialize()
  await stream.start(config)
  workflowStage.value = 'running'
}

async function stopMoCap() {
  await stream.stop()
  moCap.clearLandMarks()
  moCap.reset()
  workflowStage.value = 'unInit'
}

// 初始化人物模型
let avatar: Avatar
function initAvatar(container: HTMLCanvasElement) {
  avatar = new Avatar(container)
  avatar.start()
  watch(
    humanModel,
    async (value) => {
      const { path } = value
      const model = await avatar.loadModel(path)
      driveModel.setModel(model)
    },
    {
      immediate: true
    }
  )
}

let stream: Stream // 视频流
let moCap: HolisticMoCap // 人体姿态检测
let driveModel: DriveModel // 驱动模型
onMounted(() => {
  driveModel = new DriveModel()
  moCap = new HolisticMoCap(sourceCanvas.value!, driveModel.animateVRM.bind(driveModel))
  stream = new Stream(videoElement.value!, moCap.send.bind(moCap))
  initAvatar(avatarContainer.value!)
})

onUnmounted(() => {
  stream.stop()
  avatar.dispose()
  moCap.close()
})
</script>

<template>
  <div ref="avatarContainer" class="w-full h-full" />
  <div
    v-show="workflowStage === 'running' || workflowStage === 'pause'"
    ref="videoContainer"
    :style="style"
    class="absolute w-[400px] h-[225px] bg-gray-700 rounded-md cursor-grab"
  >
    <video ref="videoElement" class="w-full h-full left-0 top-0" loop />
    <canvas ref="sourceCanvas" class="absolute left-0 top-0 w-full h-full"></canvas>
  </div>

  <PrSidebar
    v-if="currentSideBar"
    v-model:visible="sideBarVisible"
    :header="sideBarsConfig[currentSideBar].title"
  >
    <component
      :is="sideBarsConfig[currentSideBar].component"
      v-model="humanModel"
      :model-list="PresetModelList"
    />
  </PrSidebar>

  <MediaSourceDialog v-model:visible="dialogVisible" @confirm="startMoCap" />

  <nav v-show="navVisible" class="fixed w-[160px] h-[160px] right-2 bottom-2 text-white">
    <button
      v-tooltip.top="workflowStage === 'running' ? '暂停' : '开始'"
      class="absolute rounded-full w-20 h-20 right-4 bottom-[22px] bg-primary-500"
      @click="handelCameraClick"
    >
      <i class="pi text-5xl" :class="workflowStage === 'running' ? 'pi-pause' : 'pi-camera'" />
    </button>
    <button
      v-tooltip.top="'模型'"
      class="absolute rounded-full w-12 h-12 left-[17px] bottom-[10px]"
      @click="() => changeSideBar('selectModel')"
    >
      <i class="pi pi-prime text-xl" />
    </button>
    <button v-tooltip.top="'背景'" class="absolute rounded-full w-12 h-12 left-2 bottom-[59px]">
      <i class="pi pi-images text-xl" />
    </button>
    <button
      v-tooltip.top="'Backgrounds'"
      class="absolute rounded-full w-12 h-12 left-[45px] top-[10px]"
    >
      <i class="pi pi-palette text-xl" />
    </button>
    <button v-tooltip.top="'Call a friend'" class="absolute rounded-full w-12 h-12 right-3 top-2">
      <i class="pi pi-whatsapp text-xl" />
    </button>
    <svg
      class="w-full h-full"
      width="502"
      height="494"
      viewBox="0 0 502 494"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_b)">
        <circle cx="328" cy="304" r="174" fill="#2E525F" />
        <circle cx="120.5" cy="405.5" r="90" fill="#2E525F" />
        <circle cx="120.5" cy="337.5" r="76.5" fill="#2E525F" />
        <circle cx="88.5" cy="234.5" r="90" fill="#2E525F" />
        <circle cx="175.52" cy="180.5" r="76.5" fill="#2E525F" />
        <circle cx="210.5" cy="92.5" r="90" fill="#2E525F" />
        <circle cx="304.52" cy="119.5" r="76.5" fill="#2E525F" />
        <circle cx="398.5" cy="88.5" r="90" fill="#2E525F" />
      </g>
      <defs>
        <filter
          id="filter0_b"
          x="-49"
          y="-49"
          width="600"
          height="592"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="24.5" result="blur" />
          <feColorMatrix
            id="colorMatrixElement"
            in="blur"
            mode="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 25 -15"
            result="matrix"
          />
        </filter>
      </defs>
    </svg>
  </nav>

  <PrSpeedDial
    :model="menuItems"
    direction="down"
    class="right-2 top-3"
    :tooltip-options="{ position: 'right' }"
  />

  <Teleport v-if="workflowStage === 'loading'" to="body">
    <div
      class="absolute bg-[rgba(0,0,0,0.5)] inset-0 flex flex-col items-center justify-center z-[99]"
    >
      <PrProgressSpinner stroke-width="6" />
      <span class="text-white mt-4 text-lg animate-pulse">模型加载中...</span>
    </div>
  </Teleport>
</template>
