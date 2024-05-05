<script setup lang="ts">
import type { ModelInfo } from '@renderer/common/config/modelConfig'

defineProps<{
  model: ModelInfo
  active: boolean
}>()

defineEmits<{
  select: [ModelInfo]
  delete: [ModelInfo]
}>()
</script>

<template>
  <div class="relative model-item rounded-full cursor-pointer">
    <div
      class="model-card relative w-[150px] h-[150px] rounded-full overflow-hidden flex justify-center items-center border-4 border-white outline bg-white/90"
      :class="
        active ? 'outline-[7px] outline-primary-300' : 'hover:outline-[5px] hover:outline-white/40'
      "
      @click="$emit('select', model)"
    >
      <PrImage
        v-if="model.cover"
        :src="model.cover"
        :alt="model.name"
        class="w-full h-full"
        image-class="h-full object-cover"
      />
      <PrAvatar
        v-else
        :label="model.name[0].toUpperCase()"
        shape="circle"
        class="w-full h-full text-9xl"
      />
      <div
        class="absolute items-center justify-center text-xs text-center bg-black/50 text-white bottom-0 w-full h-1/4 hidden"
      >
        <!-- <PrInplace :closable="true">
          <template #display>
            {{ model.name }}
          </template>
          <template #content>
            <PrInputText autofocus />
          </template>
        </PrInplace> -->
        {{ model.name }}
      </div>
    </div>

    <div
      v-if="model.userUpload"
      class="absolute w-[40px] h-[40px] top-1 right-1 z-10 bg-gray-300 rounded-full items-center justify-center overflow-hidden cursor-pointer outline-white/40 hover:outline hover:outline-4 hidden"
      @click="$emit('delete', model)"
    >
      <i class="pi pi-minus text-2xl text-red-700" />
    </div>
  </div>
</template>

<style scoped>
.model-item:hover .absolute {
  display: flex;
}
</style>
