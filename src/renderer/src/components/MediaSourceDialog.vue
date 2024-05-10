<script setup lang="ts">
import type { StreamType, StreamConfig } from '@renderer/common/stream'
import { ref, computed } from 'vue'

const visible = defineModel<boolean>('visible')
const emits = defineEmits<{
  confirm: [StreamConfig]
}>()

const mediaSource = ref<StreamType>('camera')

const cameraList = ref<Array<{ label: string; deviceId: string }>>([])
const loading = ref(false)
const deviceId = ref<string>()
// 获取摄像头列表
async function getCameraList() {
  loading.value = true
  const devices = (await navigator.mediaDevices.enumerateDevices())
    .filter((device) => device.kind === 'videoinput')
    .map(({ label, deviceId }) => ({
      label,
      deviceId
    }))
  cameraList.value = devices
  loading.value = false
}

const videoFile = ref<File>()
function handleVideoSelect(e) {
  const file = e.files[0]
  if (!file) return
  videoFile.value = file
}

const comfirmDisabled = computed(() => {
  return !(mediaSource.value === 'camera' ? deviceId.value : videoFile.value)
})

function handleConfirm() {
  if (mediaSource.value === 'camera') {
    emits('confirm', {
      mediaSource: 'camera',
      deviceId: deviceId.value!
    })
  } else {
    emits('confirm', {
      mediaSource: 'video',
      videoFile: videoFile.value!
    })
  }
}
</script>

<template>
  <PrDialog v-model:visible="visible" header="媒体源设置" :style="{ width: '25rem' }">
    <div class="w-full">
      <section class="flex items-center mb-4">
        <span>媒体源：</span>
        <PrDropdown
          v-model="mediaSource"
          :options="[
            { label: '摄像头', value: 'camera' },
            { label: '视频', value: 'video' }
          ]"
          option-label="label"
          option-value="value"
          class="flex-1"
        />
      </section>
      <section v-if="mediaSource === 'video'" class="flex items-center">
        <span>视频文件：</span>
        <PrFileUpload
          custom-upload
          accept="video/*"
          mode="basic"
          choose-label="选择视频文件"
          @select="handleVideoSelect"
        />
      </section>
      <section v-else class="flex items-center">
        <span>摄像头：</span>
        <PrDropdown
          v-model="deviceId"
          class="flex-1"
          :options="cameraList"
          option-label="label"
          option-value="deviceId"
          placeholder="请选择摄像头"
          scroll-height="100px"
          show-clear
          :virtual-scroller-options="{
            lazy: true,
            onLazyLoad: getCameraList,
            showLoader: true,
            loading: loading,
            delay: 250
          }"
        />
      </section>

      <footer class="mt-4 w-full flex justify-end gap-4">
        <PrButton class="w-20" severity="secondary" @click="visible = false"> 取消 </PrButton>
        <PrButton class="w-20" :disabled="comfirmDisabled" @click="handleConfirm"> 确定 </PrButton>
      </footer>
    </div>
  </PrDialog>
</template>
