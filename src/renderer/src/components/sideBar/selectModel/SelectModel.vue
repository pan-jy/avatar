<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import { ModelInfo } from '@renderer/common/config/modelConfig'
import type { Avatar } from '@renderer/common/three/Avatar'
import { inject, onMounted, ref, toRaw } from 'vue'

const props = defineProps<{
  avatar: Avatar
}>()

const curModel = ref()
const config = inject(configKey)
const modelList = config!.modelList

function handelUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  config!.uploadModel({
    name: file.name.replace(/\.\w+$/, ''),
    userUpload: true,
    path: file.path
  })
}
function handelSelect(model: ModelInfo) {
  curModel.value = model
  props.avatar.handleModelChange(toRaw(model))
}
function handelDelete(model: ModelInfo) {
  config!.deleteModel(model)
  if (curModel.value?.path === model.path) handelSelect(modelList.value[0])
}

onMounted(async () => {
  const { path } = props.avatar.modelInfo!
  curModel.value = modelList.value.find((model) => model.path === path) || modelList[0]
})
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <FileUpload accept=".vrm,.fbx,.glb,.gltf" @change="handelUpload" />
    <PrDivider type="solid" />
    <ModelItem
      v-for="model in modelList"
      :key="model?.path"
      :model="model"
      :active="curModel?.path === model?.path"
      @select="handelSelect"
      @delete="handelDelete"
    />
  </div>
</template>
