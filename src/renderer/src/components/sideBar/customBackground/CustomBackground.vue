<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { BackgroundImage, tabs } from '@renderer/common/config/backgroundConfig'
import type { Avatar } from '@renderer/common/three/Avatar'
import { configKey } from '@renderer/common/config/Config'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps<{
  avatar: Avatar
}>()

const curTab = ref(0)
const curBg = ref()

const config = inject(configKey)!
const backgroundImages = config.backgroundImages

const toast = useToast()
const confirm = useConfirm()

onMounted(async () => {
  const { type, value } = props.avatar.backgroundConfig!
  curTab.value = type
  if (type === 2) {
    curBg.value = value // 16进制颜色
  } else {
    curBg.value =
      backgroundImages.value[type].find((bg) => bg.src === value)?.src ||
      backgroundImages.value[0][0].src
  }
})

async function handleUploadBgImage(e: InputEvent) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await config!.uploadBackground(curTab.value, {
      name: file.name.replace(/\.\w+$/, '').slice(0, 10),
      userUpload: true,
      src: file.path
    })
    toast.add({
      severity: 'success',
      summary: '上传成功',
      detail: '背景图片上传成功',
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

function handleChangeBg(value?: string) {
  curBg.value = value
  props.avatar.setBackground({
    type: curTab.value,
    value: value
  })
}

function handleDelete(background: BackgroundImage) {
  const type = curTab.value
  confirm.require({
    message: '确认删除该背景图片？',
    header: '删除背景',
    icon: 'pi pi-info-circle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await config!.deleteBackground(type, background)
      if (curBg.value === background.src) handleChangeBg(backgroundImages.value[type][0].src)
      toast.add({
        severity: 'success',
        summary: '删除成功',
        detail: '背景已删除',
        life: 3000
      })
    }
  })
}
</script>

<template>
  <div class="w-[200px] h-full">
    <div class="w-full">
      <div v-if="curTab === 2">
        <PrColorPicker
          :default-color="curBg"
          inline
          class="rounded-2xl overflow-hidden cursor-pointer"
          @change="
            ({ value }) => {
              const color = `#${value}`
              handleChangeBg(color)
            }
          "
        />

        <div
          v-if="curBg?.startsWith('#')"
          class="text-white text-3xl flex items-center justify-center mt-4 bg-surface-500 rounded-2xl py-4"
        >
          <span class="text-gray-300">#</span>
          <span>{{ curBg?.replace('#', '') }}</span>
        </div>
      </div>
      <div v-else class="flex flex-col gap-4 items-center after:h-[60px]">
        <FileUpload accept="image/*" @change="handleUploadBgImage" />
        <PrDivider type="solid" />
        <ImageItem
          v-for="bg in backgroundImages[curTab]"
          :key="bg.src"
          :image="bg"
          class="w-[180px] h-[180px] bg-white/90"
          :active="curBg === bg.src"
          @select="handleChangeBg"
          @delete="handleDelete"
        />
      </div>
    </div>

    <PrDock :model="tabs" position="bottom" class="h-[60px]">
      <template #item="{ item, index }">
        <div v-tooltip.top="item.label" @click="curTab = index">
          <SvgIcon
            :class="curTab === index ? 'scale-150 text-primary-400' : 'text-white'"
            class="w-8 h-8 cursor-pointer"
            :name="item.icon"
          />
        </div>
      </template>
    </PrDock>
  </div>
</template>
