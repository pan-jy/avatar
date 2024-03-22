<template>
  <div>
    <video ref="videoElement"></video>
    <canvas ref="canvas" width="256px" height="144px"></canvas>
  </div>
</template>

<script setup lang="ts">
// import { Holistic } from '@mediapipe/holistic'
// import { Camera } from '@mediapipe/camera_utils'
// import { onMounted, onUnmounted, ref } from 'vue'

// const videoElement = ref<HTMLVideoElement | null>(null)
// const canvas = ref<HTMLCanvasElement | null>(null)

// const holistic = new Holistic({
//   locateFile: (file) => {
//     return `${import.meta.env.RENDERER_VITE_HOLISTIC_CDN}${file}`
//   }
// })

// let camera: Camera

// onMounted(() => {
//   if (!videoElement.value) return
//   if (!canvas.value) return
//   const context = canvas.value.getContext('2d')!
//   camera = new Camera(videoElement.value, {
//     onFrame: async () => {
//       await holistic.send({ image: videoElement.value! })
//     },
//     width: 1280,
//     height: 720
//   })

//   holistic.onResults((results) => {
//     if (!canvas.value) return
//     context.clearRect(0, 0, canvas.value!.width, canvas.value!.height)
//     context.drawImage(
//       results.image,
//       0,
//       0,
//       results.image.width,
//       results.image.height,
//       0,
//       0,
//       canvas.value!.width,
//       canvas.value!.height
//     )
//     console.log(results)
//   })

//   camera.start()
// })

// onUnmounted(() => {
//   camera.stop()
// })
</script>

<style scoped></style>
