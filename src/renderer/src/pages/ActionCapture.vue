<template>
  <div class="relative h-full">
    <section class="flex items-center gap-4 mb-4">
      <PrButton class="gap-1" @click="tuggleCamera">
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
      />
    </section>
    <section ref="container" class="grid grid-cols-2 gap-2 relative">
      <div ref="avatarContainer" />
      <video ref="videoElement" class="bg-gray-500" loop />
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
import * as mpHolistic from '@mediapipe/holistic'
import { Camera, CameraInterface } from '@mediapipe/camera_utils'
import * as drawingUtils from '@mediapipe/drawing_utils'
// import * as controls from '@mediapipe/control_utils'
// import '@mediapipe/control_utils/control_utils.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { PresetModelList } from '@renderer/common/modelConfig'
import { useThrottleFn } from '@vueuse/core'
import { Avatar } from '@renderer/three/Avatar'

const videoElement = ref<HTMLVideoElement | null>(null)
const avatarContainer = ref<HTMLCanvasElement | null>(null)
const sourceCanvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const controlsElement = ref<HTMLDivElement | null>(null)

const showLandmarks = ref(true)
const workflowStage = ref<'unInit' | 'loading' | 'running' | 'pause'>('unInit')
const mediaSource = ref<'camera' | 'video'>('camera')
const humanModel = ref(PresetModelList[0])

const holistic = new mpHolistic.Holistic({
  locateFile: (file) => {
    return import.meta.env.RENDERER_VITE_HOLISTIC_CDN + file
  }
})

// 处理窗口大小变化
function handelResize() {
  const width = (container.value!.clientWidth - 8) / 2
  const height = (width / 16) * 9

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

function handelVideoSelect(e) {
  const file = e.files[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  videoElement.value!.src = url
}

// 移除 landmarks 中对应 index 的标记
function removeElements(landmarks: mpHolistic.NormalizedLandmarkList, elements: number[]) {
  for (const element of elements) {
    delete landmarks[element]
  }
}

/**
 * 移除不需要绘制的标记
 * - 0-10: 面部标记
 * - 15-22: 双手标记
 * @param results 检测结果
 */
function removeLandmarks(results: mpHolistic.Results) {
  if (results.poseLandmarks) {
    removeElements(
      results.poseLandmarks,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]
    )
  }
}

// 连接两个点
function connect(
  ctx: CanvasRenderingContext2D,
  connectors: Array<[mpHolistic.NormalizedLandmark, mpHolistic.NormalizedLandmark]>
) {
  const { width, height } = ctx.canvas
  if (!width || !height) return
  for (const connector of connectors) {
    const from = connector[0]
    const to = connector[1]
    if (from && to) {
      // 如果两个点的 visibility 都小于 0.1，则不绘制
      if (from.visibility && to.visibility && (from.visibility < 0.1 || to.visibility < 0.1)) {
        continue
      }
      ctx.beginPath()
      ctx.moveTo(from.x * width, from.y * height)
      ctx.lineTo(to.x * width, to.y * height)
      ctx.stroke()
    }
  }
}

// const activeEffect = 'mask'
// const fpsControl = new controls.FPS()
let sourceCtx: CanvasRenderingContext2D
function onResults(results: mpHolistic.Results) {
  if (!sourceCanvas.value) return
  if (!sourceCtx) sourceCtx = sourceCanvas.value!.getContext('2d')!

  removeLandmarks(results)

  // 更新帧率
  // fpsControl.tick()

  const { width, height } = sourceCanvas.value

  sourceCtx.save()
  sourceCtx.clearRect(0, 0, width, height)

  // // 如果开启了分割，则绘制分割 mask
  // if (results.segmentationMask) {
  //   sourceCtx.drawImage(results.segmentationMask, 0, 0, width, height)
  //   // Only overwrite existing pixels.
  //   if (activeEffect === 'mask' || activeEffect === 'both') {
  //     sourceCtx.globalCompositeOperation = 'source-in'
  //     // This can be a color or a texture or whatever...
  //     sourceCtx.fillStyle = '#00FF007F'
  //     sourceCtx.fillRect(0, 0, width, height)
  //   } else {
  //     sourceCtx.globalCompositeOperation = 'source-out'
  //     sourceCtx.fillStyle = '#0000FF7F'
  //     sourceCtx.fillRect(0, 0, width, height)
  //   }
  //   // Only overwrite missing pixels.
  //   sourceCtx.globalCompositeOperation = 'destination-atop'
  //   sourceCtx.drawImage(results.image, 0, 0, width, height)
  //   sourceCtx.globalCompositeOperation = 'source-over'
  // } else {
  //   sourceCtx.drawImage(results.image, 0, 0, width, height)
  // }

  if (showLandmarks.value) drawLandmarks(sourceCtx, results)

  sourceCtx.restore()
}

// 绘制骨架
function drawLandmarks(sourceCtx: CanvasRenderingContext2D, results: mpHolistic.Results) {
  // 先连接手肘与手腕
  sourceCtx.lineWidth = 5
  if (results.poseLandmarks) {
    if (results.rightHandLandmarks) {
      sourceCtx.strokeStyle = 'white'
      connect(sourceCtx, [
        [
          results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
          results.rightHandLandmarks[0]
        ]
      ])
    }
    if (results.leftHandLandmarks) {
      sourceCtx.strokeStyle = 'white'
      connect(sourceCtx, [
        [results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW], results.leftHandLandmarks[0]]
      ])
    }
  }

  // Pose...
  drawingUtils.drawConnectors(sourceCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(
    sourceCtx,
    Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map((index) => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' }
  )
  drawingUtils.drawLandmarks(
    sourceCtx,
    Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map((index) => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' }
  )

  // Hands...
  drawingUtils.drawConnectors(sourceCtx, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(sourceCtx, results.rightHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(0,217,231)',
    lineWidth: 2,
    radius: (data: drawingUtils.Data) => {
      return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
    }
  })
  drawingUtils.drawConnectors(sourceCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(sourceCtx, results.leftHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(255,138,0)',
    lineWidth: 2,
    radius: (data: drawingUtils.Data) => {
      return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
    }
  })

  // Face...
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_TESSELATION, {
    color: '#C0C0C070',
    lineWidth: 1
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYE, {
    color: 'rgb(0,217,231)'
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYEBROW, {
    color: 'rgb(0,217,231)'
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYE, {
    color: 'rgb(255,138,0)'
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYEBROW, {
    color: 'rgb(255,138,0)'
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_FACE_OVAL, {
    color: '#E0E0E0',
    lineWidth: 5
  })
  drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_LIPS, {
    color: '#E0E0E0',
    lineWidth: 5
  })
}

// 切换媒体源
function changeMediaSource() {
  holistic.reset()
  videoElement.value!.src = ''
  videoElement.value!.srcObject = null
  workflowStage.value = 'unInit'
  sourceCtx?.clearRect(0, 0, sourceCanvas.value!.width, sourceCanvas.value!.height)
}

// 开启/关闭摄像头
async function tuggleCamera() {
  switch (workflowStage.value) {
    case 'running':
      if (mediaSource.value === 'camera') {
        workflowStage.value = 'unInit'
        videoElement.value!.srcObject = null
        videoElement.value!.onloadedmetadata = null
        sourceCtx?.clearRect(0, 0, sourceCanvas.value!.width, sourceCanvas.value!.height)
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

function tuggleLandmarks() {
  showLandmarks.value = !showLandmarks.value
  showLandmarks.value
    ? sourceCanvas.value!.classList.remove('hidden')
    : sourceCanvas.value!.classList.add('hidden')
}

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

class VideoStream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #animationId = -1

  constructor(videoElement: HTMLVideoElement) {
    this.#videoElement = videoElement
  }

  start() {
    this.#videoElement.play()
    const sendFrame = async () => {
      await holistic.send({ image: this.#videoElement })
      this.#animationId = requestAnimationFrame(sendFrame)
    }
    this.#animationId = requestAnimationFrame(sendFrame)
    return Promise.resolve()
  }

  stop() {
    this.#videoElement.pause()
    cancelAnimationFrame(this.#animationId)
    return Promise.resolve()
  }
}
// class CameraStream implements CameraInterface {
//   #videoElement: HTMLVideoElement
//   #animationId = -1
//   #options: { width: number; height: number }
//   #stream: MediaStream | null = null

//   constructor(videoElement: HTMLVideoElement, options: { width: number; height: number }) {
//     this.#videoElement = videoElement
//     this.#options = options
//   }

//   async start() {
//     // 打开摄像头
//     this.#stream = await window.navigator.mediaDevices.getUserMedia({ video: this.#options })
//     this.#videoElement.srcObject = this.#stream
//     this.#videoElement.onloadedmetadata = () => {
//       this.#videoElement.play()
//       const sendFrame = async () => {
//         await holistic.send({ image: this.#videoElement })
//         this.#animationId = requestAnimationFrame(sendFrame)
//       }
//       this.#animationId = requestAnimationFrame(sendFrame)
//     }
//   }

//   stop() {
//     this.#stream?.getTracks().forEach((track) => track.stop())
//     cancelAnimationFrame(this.#animationId)
//     this.#videoElement.onloadedmetadata = null
//     return Promise.resolve()
//   }
// }

class Stream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #camera: Camera | null = null
  #video: VideoStream | null = null
  #stream: Camera | VideoStream | null = null

  constructor(videoElement: HTMLVideoElement) {
    this.#videoElement = videoElement
    this.#initWatch()
  }

  #initCamera() {
    const { width, height } = handelResize()
    // this.#camera = new CameraStream(this.#videoElement, { width, height })
    this.#camera = new Camera(this.#videoElement, {
      onFrame: async () => {
        await holistic.send({ image: this.#videoElement })
      },
      width,
      height
    })
  }

  #initVideo() {
    this.#video = new VideoStream(this.#videoElement)
  }

  #initWatch() {
    watch(
      mediaSource,
      (value) => {
        if (value === 'camera') {
          if (!this.#camera) this.#initCamera()
          this.#stream = this.#camera
        } else {
          if (!this.#video) this.#initVideo()
          this.#stream = this.#video
        }
      },
      { immediate: true }
    )
  }

  start() {
    if (!this.#stream) return Promise.resolve()
    return this.#stream.start()
  }

  stop() {
    if (!this.#stream) return Promise.resolve()
    this.#stream.stop()
    return Promise.resolve()
  }
}
let stream: Stream
function initStream(videoElement: HTMLVideoElement) {
  stream = new Stream(videoElement)
}

onMounted(() => {
  if (!videoElement.value) return
  if (!avatarContainer.value) return
  if (!sourceCanvas.value) return
  if (!container.value) return
  if (!controlsElement.value) return

  initStream(videoElement.value)
  initAvatar(avatarContainer.value)

  holistic.onResults((results: mpHolistic.Results) => {
    console.log(results)
    onResults(results)
  })
})

onUnmounted(() => {
  stream.stop()
  window.removeEventListener('resize', onResize)
  avatar.dispose()
})
</script>
