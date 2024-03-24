<template>
  <div class="relative h-full">
    <PrButton class="mb-4" @click="tuggleCamera">
      <div v-if="isCameraStarted">
        <i class="pi pi-pause" />
        <span> 停止 </span>
      </div>
      <div v-else>
        <i class="pi pi-caret-right" />
        <span> 开始 </span>
      </div>
    </PrButton>
    <section ref="container" class="grid grid-cols-2 gap-2">
      <video ref="videoElement" class="bg-gray-500 dark:bg-surface-500"></video>
      <canvas ref="canvas" class="bg-gray-500 dark:bg-surface-500"></canvas>
    </section>

    <div ref="controlsElement" />
  </div>
</template>

<script setup lang="ts">
import * as mpHolistic from '@mediapipe/holistic'
import { Camera } from '@mediapipe/camera_utils'
import * as drawingUtils from '@mediapipe/drawing_utils'
// import * as controls from '@mediapipe/control_utils'
// import '@mediapipe/control_utils/control_utils.css'
import { onMounted, onUnmounted, ref } from 'vue'

const videoElement = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const controlsElement = ref<HTMLDivElement | null>(null)
const isCameraStarted = ref(false)

function tuggleCamera() {
  if (isCameraStarted.value) {
    camera.stop()
    isCameraStarted.value = false
  } else {
    camera.start()
    isCameraStarted.value = true
  }
}

function handelResize() {
  const width = (container.value!.clientWidth - 8) / 2
  const height = (width / 16) * 9

  canvas.value!.width = width
  canvas.value!.height = height
  videoElement.value!.style.width = `${width}px`
  videoElement.value!.style.height = `${height}px`

  return {
    width,
    height
  }
}

function removeElements(landmarks: mpHolistic.NormalizedLandmarkList, elements: number[]) {
  for (const element of elements) {
    delete landmarks[element]
  }
}

function removeLandmarks(results: mpHolistic.Results) {
  if (results.poseLandmarks) {
    removeElements(
      results.poseLandmarks,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]
    )
  }
}

function connect(
  ctx: CanvasRenderingContext2D,
  connectors: Array<[mpHolistic.NormalizedLandmark, mpHolistic.NormalizedLandmark]>
): void {
  const canvas = ctx.canvas
  for (const connector of connectors) {
    const from = connector[0]
    const to = connector[1]
    if (from && to) {
      if (from.visibility && to.visibility && (from.visibility < 0.1 || to.visibility < 0.1)) {
        continue
      }
      ctx.beginPath()
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height)
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height)
      ctx.stroke()
    }
  }
}

const activeEffect = 'mask'
// const fpsControl = new controls.FPS()
let canvasCtx: CanvasRenderingContext2D
function onResults(results: mpHolistic.Results): void {
  console.log('🚀 ~ onResults ~ results:', results)
  if (!canvas.value) return
  if (!canvasCtx) canvasCtx = canvas.value!.getContext('2d')!

  // 移除不需要绘制的标记
  removeLandmarks(results)

  // 更新帧率
  // fpsControl.tick()

  canvasCtx.save()
  canvasCtx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  if (results.segmentationMask) {
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvas.value.width, canvas.value.height)

    // Only overwrite existing pixels.
    if (activeEffect === 'mask' || activeEffect === 'both') {
      canvasCtx.globalCompositeOperation = 'source-in'
      // This can be a color or a texture or whatever...
      canvasCtx.fillStyle = '#00FF007F'
      canvasCtx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    } else {
      canvasCtx.globalCompositeOperation = 'source-out'
      canvasCtx.fillStyle = '#0000FF7F'
      canvasCtx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    }

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop'
    canvasCtx.drawImage(results.image, 0, 0, canvas.value.width, canvas.value.height)

    canvasCtx.globalCompositeOperation = 'source-over'
  } else {
    canvasCtx.drawImage(results.image, 0, 0, canvas.value.width, canvas.value.height)
  }

  // Connect elbows to hands. Do this first so that the other graphics will draw
  // on top of these marks.
  canvasCtx.lineWidth = 5
  if (results.poseLandmarks) {
    if (results.rightHandLandmarks) {
      canvasCtx.strokeStyle = 'white'
      connect(canvasCtx, [
        [
          results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
          results.rightHandLandmarks[0]
        ]
      ])
    }
    if (results.leftHandLandmarks) {
      canvasCtx.strokeStyle = 'white'
      connect(canvasCtx, [
        [results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW], results.leftHandLandmarks[0]]
      ])
    }
  }

  // Pose...
  drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(
    canvasCtx,
    Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map((index) => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' }
  )
  drawingUtils.drawLandmarks(
    canvasCtx,
    Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map((index) => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' }
  )

  // Hands...
  drawingUtils.drawConnectors(canvasCtx, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(0,217,231)',
    lineWidth: 2,
    radius: (data: drawingUtils.Data) => {
      return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
    }
  })
  drawingUtils.drawConnectors(canvasCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
    color: 'white'
  })
  drawingUtils.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(255,138,0)',
    lineWidth: 2,
    radius: (data: drawingUtils.Data) => {
      return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
    }
  })

  // Face...
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_TESSELATION, {
    color: '#C0C0C070',
    lineWidth: 1
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYE, {
    color: 'rgb(0,217,231)'
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYEBROW, {
    color: 'rgb(0,217,231)'
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYE, {
    color: 'rgb(255,138,0)'
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYEBROW, {
    color: 'rgb(255,138,0)'
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_FACE_OVAL, {
    color: '#E0E0E0',
    lineWidth: 5
  })
  drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LIPS, {
    color: '#E0E0E0',
    lineWidth: 5
  })

  canvasCtx.restore()
}

let camera: Camera
const holistic = new mpHolistic.Holistic({
  locateFile: (file) => {
    return `${import.meta.env.RENDERER_VITE_HOLISTIC_CDN}${file}`
  }
})

onMounted(() => {
  if (!videoElement.value) return
  if (!canvas.value) return
  if (!container.value) return
  if (!controlsElement.value) return

  const { width, height } = handelResize()
  window.addEventListener('resize', handelResize)

  camera = new Camera(videoElement.value, {
    onFrame: async () => {
      await holistic.send({ image: videoElement.value! })
    },
    width,
    height
  })

  // new controls.ControlPanel(controlsElement.value, {
  //   selfieMode: true,
  //   modelComplexity: 1,
  //   smoothLandmarks: true,
  //   enableSegmentation: false,
  //   smoothSegmentation: true,
  //   minDetectionConfidence: 0.5,
  //   minTrackingConfidence: 0.5,
  //   effect: 'background'
  // })
  //   .add([
  //     new controls.StaticText({ title: '控制面板' }),
  //     fpsControl,
  //     new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
  //     new controls.SourcePicker({
  //       onSourceChanged: () => {
  //         // Resets because the pose gives better results when reset between
  //         // source changes.
  //         holistic.reset()
  //       },
  //       onFrame: async (input: controls.InputImage, size: controls.Rectangle) => {
  //         const aspect = size.height / size.width
  //         let width: number, height: number
  //         if (window.innerWidth > window.innerHeight) {
  //           height = window.innerHeight
  //           width = height / aspect
  //         } else {
  //           width = window.innerWidth
  //           height = width * aspect
  //         }
  //         canvas.value!.width = width
  //         canvas.value!.height = height
  //         await holistic.send({ image: input })
  //       }
  //     }),
  //     new controls.Slider({
  //       title: 'Model Complexity',
  //       field: 'modelComplexity',
  //       discrete: ['Lite', 'Full', 'Heavy']
  //     }),
  //     new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
  //     new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
  //     new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
  //     new controls.Slider({
  //       title: 'Min Detection Confidence',
  //       field: 'minDetectionConfidence',
  //       range: [0, 1],
  //       step: 0.01
  //     }),
  //     new controls.Slider({
  //       title: 'Min Tracking Confidence',
  //       field: 'minTrackingConfidence',
  //       range: [0, 1],
  //       step: 0.01
  //     }),
  //     new controls.Slider({
  //       title: 'Effect',
  //       field: 'effect',
  //       discrete: { background: 'Background', mask: 'Foreground' }
  //     })
  //   ])
  //   .on((x) => {
  //     const options = x as mpHolistic.Options
  //     // videoElement.value!.classList.toggle('selfie', options.selfieMode)
  //     activeEffect = (x as { [key: string]: string })['effect']
  //     holistic.setOptions(options)
  //   })

  holistic.onResults(onResults)
})

onUnmounted(() => {
  camera.stop()
  window.removeEventListener('resize', handelResize)
})
</script>
