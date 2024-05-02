<script setup lang="ts">
import { BackgroundImage } from './backgroundConfig'

defineProps<{
  bg: BackgroundImage
  active: boolean
}>()
</script>

<template>
  <div
    v-tooltip.bottom="bg.name"
    class="rounded-2xl overflow-hidden flex justify-center items-center border-4 border-white outline bg-white/90"
    :class="
      active ? 'outline-[7px] outline-primary-300' : 'hover:outline-[5px] hover:outline-white/40'
    "
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
  </div>
</template>
