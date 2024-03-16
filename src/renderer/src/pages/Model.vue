<template>
  <div ref="container" class="w-full h-full overflow-hidden"></div>
</template>

<script setup lang="ts">
import { Model } from '@renderer/three/Model'
import { onMounted, ref } from 'vue'

const container = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (!container.value) return
  const model = new Model(container.value)
  model.render()
})
</script>
