<script setup lang="ts">
import type { ModelInfo } from '@renderer/common/modelConfig'

defineProps<{
  model: ModelInfo
  active: boolean
}>()

function handelClick(path: string) {
  if (path) window.electron.ipcRenderer.invoke('open-new-win', `/model?path=${path}`)
}
</script>

<template>
  <div
    v-tooltip.bottom="model.name"
    class="model-card relative w-[100px] h-[100px] rounded-full overflow-hidden flex justify-center items-center border-4 border-white outline bg-white/90"
    :class="
      active ? 'outline-[7px] outline-primary-300' : 'hover:outline-[5px] hover:outline-white/40'
    "
  >
    <PrImage
      v-if="model.cover"
      :src="model.cover"
      :alt="model.name"
      class="w-full h-full"
      image-class="h-full object-cover"
    />
    <div
      class="absolute items-center justify-center flex-wrap text-xs text-center bg-black/50 text-white bottom-0 w-full h-2/5 cursor-pointer hidden"
      @click.stop="handelClick(model.path)"
    >
      查看详情
    </div>
  </div>
</template>

<style scoped>
.model-card:hover .absolute {
  display: flex;
}
</style>
