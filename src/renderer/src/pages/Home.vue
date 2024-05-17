<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { Avatar } from '@renderer/common/three/Avatar'
import { Stream, StreamConfig } from '@renderer/common/stream'
import { HolisticMoCap } from '@renderer/common/mocap/HolisticMoCap'
import { DriveModel } from '@renderer/common/mocap/DriveModel'
import SelectModel from '@renderer/components/sideBar/selectModel/SelectModel.vue'
import CustomBackground from '@renderer/components/sideBar/customBackground/CustomBackground.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import ChartletManage from '@renderer/components/sideBar/chartletManage/ChartletManage.vue'

// DOM 元素
const avatarContainer = ref<HTMLCanvasElement | null>(null)
const videoContainer = ref<HTMLDivElement | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)
const sourceCanvas = ref<HTMLCanvasElement | null>(null)
// 状态值
// const showLandmarks = ref(true)
const workflowStage = ref<'unInit' | 'loading' | 'running' | 'pause'>('unInit')
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

const sideBars = {
  selectModel: {
    title: '选择模型',
    component: SelectModel,
    sideBarConfig: {}
  },
  customBackground: {
    title: '自定义背景',
    component: CustomBackground,
    sideBarConfig: {}
  },
  chartletManage: {
    title: '贴图',
    component: ChartletManage,
    sideBarConfig: {
      modal: false
    }
  }
}
type SideBarType = keyof typeof sideBars
const sideBarVisible = ref(false)
const currentSideBar = ref<SideBarType>('selectModel')
function changeSideBar(type: SideBarType) {
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

function handleCameraClick() {
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

let stream: Stream // 视频流
let moCap: HolisticMoCap // 人体姿态检测
let driveModel: DriveModel // 驱动模型
let avatar: Avatar // 人物模型
onMounted(() => {
  driveModel = new DriveModel()
  moCap = new HolisticMoCap(sourceCanvas.value!, driveModel.animateVRM.bind(driveModel))
  stream = new Stream(videoElement.value!, moCap.send.bind(moCap))
  avatar = new Avatar(avatarContainer.value!, driveModel.setModel.bind(driveModel))
  avatar.start()
})

onUnmounted(() => {
  stream.stop()
  avatar.dispose()
  moCap.close()
})
</script>

<template>
  <div ref="avatarContainer" class="w-full h-full">
    <canvas id="fabricCanvas" :width="width" :height="height" />
  </div>

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
    :header="sideBars[currentSideBar].title"
    v-bind="sideBars[currentSideBar]?.sideBarConfig"
  >
    <component :is="sideBars[currentSideBar].component" :avatar="avatar" />
  </PrSidebar>

  <MediaSourceDialog v-model:visible="dialogVisible" @confirm="startMoCap" />

  <PawNav v-show="navVisible">
    <template #main>
      <button
        v-tooltip.top="workflowStage === 'running' ? '暂停' : '开始'"
        class="w-full h-full"
        @click="handleCameraClick"
      >
        <i class="pi text-5xl" :class="workflowStage === 'running' ? 'pi-pause' : 'pi-camera'" />
      </button>
    </template>

    <template #1>
      <button v-tooltip.top="'模型'" class="w-full h-full" @click="changeSideBar('selectModel')">
        <i class="pi pi-prime text-xl" />
      </button>
    </template>

    <template #2>
      <button
        v-tooltip.top="'背景'"
        class="w-full h-full"
        @click="changeSideBar('customBackground')"
      >
        <i class="pi pi-images text-xl" />
      </button>
    </template>

    <template #3>
      <button v-tooltip.top="'贴图'" class="w-full h-full" @click="changeSideBar('chartletManage')">
        <i class="pi pi-slack text-xl" />
      </button>
    </template>

    <template #4>
      <button v-tooltip.top="'媒体流转发'" class="w-full h-full" @click="avatar.forwardStream">
        <i class="pi pi-send text-xl" />
      </button>
    </template>
  </PawNav>

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

  <Toast />
  <ConfirmDialog pt:icon:class="text-4xl" style="width: 300px" />
</template>
