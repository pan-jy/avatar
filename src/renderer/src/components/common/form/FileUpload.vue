<script setup lang="ts">
defineProps<{
  accept: string
}>()
</script>

<template>
  <div
    class="relative min-w-[120px] min-h-[120px] rounded-full flex items-center justify-center overflow-hidden border-4 border-white outline hover:outline-[7px] bg-white/90"
  >
    <input type="file" class="w-full h-full absolute opacity-0 cursor-pointer" :accept="accept" />
    <i class="pi pi-plus text-5xl" />
  </div>
</template>
