<script setup lang="ts">
import { MathUtils } from 'three'
const model = defineModel<number>({
  required: true,
  get(value) {
    return Math.round(MathUtils.radToDeg(value))
  },
  set(value) {
    return MathUtils.degToRad(value)
  }
})
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="flex flex-col items-center">
    <PrKnob v-model="model" :min="-180" :max="180" :size="50" value-template="{value}°" />
    <span class="leading-none -translate-y-4">{{ label }}</span>
  </div>
</template>
