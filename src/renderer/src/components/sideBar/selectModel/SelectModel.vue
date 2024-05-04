<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import type { Avatar } from '@renderer/common/three/Avatar'
import { inject, onMounted, ref } from 'vue'

const props = defineProps<{
  avatar: Avatar
}>()

const curModel = ref()
const { modelList } = inject(configKey)!

onMounted(async () => {
  const { path } = props.avatar.modelInfo!
  curModel.value = modelList.find((model) => model.path === path) || modelList[0]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ModelItem
      v-for="model in modelList"
      :key="model?.path"
      :model="model"
      :active="curModel?.path === model?.path"
      @click="
        () => {
          curModel = model
          avatar.handleModelChange(model)
        }
      "
    />
  </div>
</template>
