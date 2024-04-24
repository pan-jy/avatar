<script setup lang="ts">
import type { ModelInfo } from '@renderer/common/modelConfig'

defineProps<{
  modelList: Array<ModelInfo>
}>()

const avatar = defineModel<ModelInfo>({
  required: true
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ModelCard
      v-for="model in modelList"
      :key="model.path"
      :model="model"
      :active="avatar.path === model.path"
      @click="avatar = model"
    />
  </div>
</template>
