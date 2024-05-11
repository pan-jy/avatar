<script setup lang="ts">
import { BackgroundImage } from '../../../common/config/backgroundConfig'

defineProps<{
  bg: BackgroundImage
  active: boolean
}>()

defineEmits<{
  select: [string | undefined]
  delete: [BackgroundImage]
}>()
</script>

<template>
  <div
    v-tooltip.bottom="bg.name"
    class="relative bg-item rounded-2xl overflow-hidden flex justify-center items-center border-4 border-white outline bg-white/90"
    :class="
      active ? 'outline-[7px] outline-primary-300' : 'hover:outline-[5px] hover:outline-white/40'
    "
    @click="$emit('select', bg.src)"
  >
    <PrImage
      v-if="bg.src"
      :src="bg.cover ?? bg.src"
      :alt="bg.name"
      class="w-full h-full"
      image-class="h-full object-cover"
    />
    <div
      v-else
      class="w-full h-full bg-[url('/background/2d/transparent.png')] bg-[length:20px]"
    ></div>

    <div
      v-if="bg.userUpload"
      class="absolute w-[40px] h-[40px] top-1 right-1 z-10 bg-gray-300 rounded-full items-center justify-center overflow-hidden cursor-pointer outline-white/40 hover:outline hover:outline-4 hidden"
      @click="$emit('delete', bg)"
    >
      <i class="pi pi-minus text-2xl text-red-700" />
    </div>
  </div>
</template>

<style scoped>
.bg-item:hover .absolute {
  display: flex;
}
</style>
