<script setup lang="ts">
import { PresetModelList } from '@renderer/components/sideBar/selectModel/modelConfig'
import type { Avatar } from '@renderer/common/three/Avatar'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  avatar: Avatar
}>()

const curModel = ref(PresetModelList[0])

onMounted(async () => {
  const { path } = props.avatar.modelInfo
  curModel.value = PresetModelList.find((model) => model.path === path) || PresetModelList[0]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ModelItem
      v-for="model in PresetModelList"
      :key="model.path"
      :model="model"
      :active="curModel.path === model.path"
      @click="
        () => {
          curModel = model
          avatar.handleModelChange(model)
        }
      "
    />
  </div>
</template>
