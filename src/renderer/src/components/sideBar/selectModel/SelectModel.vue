<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import { ModelInfo } from '@renderer/common/config/modelConfig'
import type { Avatar } from '@renderer/common/three/Avatar'
import { inject, onMounted, ref, toRaw } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps<{
  avatar: Avatar
}>()

const curModel = ref()
const config = inject(configKey)
const modelList = config!.modelList

const toast = useToast()
const confirm = useConfirm()

async function handelUploadModel(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await config!.uploadModel({
      name: file.name.replace(/\.\w+$/, ''),
      userUpload: true,
      path: file.path
    })
    toast.add({
      severity: 'success',
      summary: '上传成功',
      detail: '模型已上传, 右键点击模型进行更多操作',
      life: 3000
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: '上传失败',
      detail: error.message,
      life: 3000
    })
  }
}
function handelSelect(model: ModelInfo) {
  curModel.value = model
  props.avatar.handleModelChange(toRaw(model))
}
function handelDelete(model: ModelInfo) {
  confirm.require({
    message: '确认删除该模型？',
    header: '删除模型',
    icon: 'pi pi-info-circle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await config!.deleteModel(model)
      if (curModel.value?.path === model.path) handelSelect(modelList.value[0]) // 如果删除的是当前模型, 则切换到列表第一个模型
      toast.add({
        severity: 'success',
        summary: '删除成功',
        detail: '模型已删除',
        life: 3000
      })
    }
  })
}
// function handelRename(model: ModelInfo) {
//   config!.modifyModel(model)
// }
// function handelChangeCover(model: ModelInfo) {
//   config!.modifyModel(model)
// }

onMounted(async () => {
  const { path } = props.avatar.modelInfo!
  curModel.value = modelList.value.find((model) => model.path === path) || modelList[0]
})

const menu = ref()
const menuIn = ref<ModelInfo>()
const defaultItems = [
  { label: '重命名', icon: 'pi pi-file-edit' },
  { label: '修改封面', icon: 'pi pi-image' },
  {
    label: '新窗口查看',
    icon: 'pi pi-external-link',
    command: () => {
      const path = menuIn.value!.path
      if (path) window.electron.ipcRenderer.invoke('open-new-win', `/model?path=${path}`)
    }
  }
]
const deleteItem = {
  label: '删除',
  icon: 'pi pi-trash',
  command: () => {
    handelDelete(menuIn.value!)
  }
}
const items = ref(defaultItems)
function handelRightClick(e: MouseEvent, model: ModelInfo) {
  menuIn.value = model
  if (menuIn.value.userUpload) items.value = [...defaultItems, deleteItem]
  else items.value = defaultItems
  menu.value.show(e)
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <FileUpload accept=".vrm,.fbx,.glb,.gltf" @change="handelUploadModel" />
    <PrDivider type="solid" />
    <ModelItem
      v-for="model in modelList"
      :key="model?.path"
      :model="model"
      :active="curModel?.path === model?.path"
      :class="{
        'outline outline-4 outline-green-300': menuIn?.path === model?.path
      }"
      @select="handelSelect"
      @delete="handelDelete"
      @contextmenu="handelRightClick($event, model)"
    />
    <PrContextMenu ref="menu" :model="items" @hide="menuIn = undefined" />
  </div>
</template>
