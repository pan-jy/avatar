<script setup lang="ts">
import { BackgroundImage } from '../../common/config/backgroundConfig'

interface Props {
  image: BackgroundImage
  active?: boolean
  objectFit?: 'contain' | 'cover'
  activeClass?: string
}

withDefaults(defineProps<Props>(), {
  objectFit: 'cover',
  activeClass: 'outline-[7px] outline-primary-300'
})

defineEmits<{
  select: [string | undefined]
  delete: [BackgroundImage]
}>()
</script>

<template>
  <div
    v-tooltip.bottom="image.name"
    class="relative bg-item rounded-2xl overflow-hidden flex justify-center items-center border-4 border-white outline"
    :class="active ? activeClass : 'hover:outline-[5px] hover:outline-white/40'"
    @click="$emit('select', image.src)"
  >
    <PrImage
      v-if="image.src"
      :src="image.cover ?? image.src"
      :alt="image.name"
      class="w-full h-full"
      :pt:image:class="`w-full h-full object-${objectFit}`"
    />
    <div
      v-else
      class="w-full h-full bg-[url('/background/2d/transparent.png')] bg-[length:20px]"
    ></div>

    <div
      v-if="image.userUpload"
      class="absolute w-[40px] h-[40px] top-1 right-1 z-10 bg-gray-300 rounded-full items-center justify-center overflow-hidden cursor-pointer outline-white/40 hover:outline hover:outline-4 hidden"
      @click="$emit('delete', image)"
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
