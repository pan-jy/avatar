<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import { ModelInfo } from '@renderer/common/config/modelConfig'
import type { Avatar } from '@renderer/common/three/Avatar'
import { inject, onMounted, ref, toRaw, reactive } from 'vue'
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
      name: file.name.replace(/\.\w+$/, '').slice(0, 10),
      userUpload: true,
      path: file.path
    })
    toast.add({
      severity: 'success',
      summary: '上传成功',
      detail: '模型已上传, 右键点击模型进行更多操作',
      life: 3000
    })
  } catch (error: unknown) {
    if (error instanceof Error)
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

type DialogConfig = {
  visible: boolean
  type: 'name' | 'cover'
  value: string
}
const dialogConfig = reactive<DialogConfig>({
  visible: false,
  type: 'name',
  value: ''
})

async function handelModifySave() {
  const { type, value } = dialogConfig
  try {
    let message = ''
    if (type === 'name') {
      if (!value) throw new Error('模型名称不能为空')
      if (value === menuIn.value?.name) throw new Error('新名称与旧名称相同')
      await config!.modifyModel({ ...menuIn.value!, name: value })
      message = '模型重命名成功'
    } else if (type === 'cover') {
      if (!value) throw new Error('请选择封面图片')
      await config!.modifyModel({ ...menuIn.value!, cover: value })
      message = '模型封面修改成功'
    }
    dialogConfig.visible = false
    toast.add({
      severity: 'success',
      summary: '修改成功',
      detail: message,
      life: 3000
    })
    menuIn.value = undefined
  } catch (error: unknown) {
    if (error instanceof Error)
      toast.add({
        severity: 'error',
        summary: '修改失败',
        detail: error.message,
        life: 3000
      })
  } finally {
    dialogConfig.value = ''
  }
}

onMounted(async () => {
  const { path } = props.avatar.modelInfo!
  curModel.value = modelList.value.find((model) => model.path === path) || modelList[0]
})

const menu = ref()
const menuIn = ref<ModelInfo>()
const defaultItems = [
  {
    label: '重命名',
    icon: 'pi pi-file-edit',
    command: () => {
      dialogConfig.visible = true
      dialogConfig.type = 'name'
      dialogConfig.value = menuIn.value!.name
    }
  },
  {
    label: '修改封面',
    icon: 'pi pi-image',
    command: () => {
      dialogConfig.visible = true
      dialogConfig.type = 'cover'
      dialogConfig.value = menuIn.value!.cover ?? ''
    }
  },
  {
    label: '新窗口查看',
    icon: 'pi pi-external-link',
    command: () => {
      const path = menuIn.value!.path
      if (path) window.electron.ipcRenderer.invoke('open-new-win', `/model?path=${path}`)
      menuIn.value = undefined
    }
  }
]
const deleteItem = {
  label: '删除',
  icon: 'pi pi-trash',
  command: () => {
    handelDelete(menuIn.value!)
    menuIn.value = undefined
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

    <PrDialog
      v-model:visible="dialogConfig.visible"
      modal
      :header="dialogConfig.type === 'name' ? '重命名' : '修改封面'"
      style="width: 25rem"
    >
      <section class="flex flex-col w-full gap-2">
        <div v-if="dialogConfig.type === 'name'" class="flex items-center gap-3 mb-3">
          <label for="modelName" class="font-semibold w-6rem">模型名称</label>
          <PrInputText
            id="modelName"
            v-model="dialogConfig.value"
            autofocus
            class="flex-auto"
            placeholder="请输入模型名称"
            @change="
              (e) => {
                const value = e.target.value.trim().slice(0, 10)
                e.target.value = value
                dialogConfig.value = value
              }
            "
          />
          <span
            class="absolute right-8 top-1/2 -translate-y-1/2"
            :class="dialogConfig.value.length > 10 ? 'text-red-500' : 'text-gray-500'"
          >
            {{ dialogConfig.value.length }}/10
          </span>
        </div>
        <div v-else>
          <PrFileUpload
            accept="image/*"
            custom-upload
            :file-limit="1"
            :max-file-size="10000000"
            choose-label="选择文件"
            cancel-label="取消"
            :show-upload-button="false"
            pt:progressbar:root:class="hidden"
            @select="
              (e) => {
                const file = e.files[0]
                if (!file) return
                dialogConfig.value = file.path
              }
            "
          >
            <template #empty>
              <p>拖拽或点击按钮进行上传</p>
            </template>
          </PrFileUpload>
        </div>
        <div class="flex justify-end gap-2">
          <PrButton
            type="button"
            label="取消"
            severity="secondary"
            @click="
              () => {
                dialogConfig.visible = false
                menuIn = undefined
              }
            "
          />
          <PrButton type="button" label="保存" @click="handelModifySave" />
        </div>
      </section>
    </PrDialog>

    <PrContextMenu ref="menu" :model="items" />
  </div>
</template>
