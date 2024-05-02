<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { backgroundImages, tabs } from './backgroundConfig'
import type { Avatar } from '@renderer/common/three/Avatar'

const props = defineProps<{
  avatar: Avatar
}>()

const curTab = ref(0)
const curBg = ref(backgroundImages[0][0].src)

const color = ref()
function get0xRgb(r: number, g: number, b: number) {
  const R = r.toString(16).padStart(2, '0')
  const G = g.toString(16).padStart(2, '0')
  const B = b.toString(16).padStart(2, '0')
  return `#${R}${G}${B}`
}

onMounted(async () => {
  const { type, value } = props.avatar.backgroundConfig
  curTab.value = type
  if (type === 2) {
    curBg.value = value // 16进制颜色
  } else {
    curBg.value =
      backgroundImages[type].find((bg) => bg.src === value)?.src || backgroundImages[0][0].src
  }
})
</script>

<template>
  <div class="w-[200px] h-full">
    <div class="w-full">
      <div v-if="curTab === 2">
        <PrColorPicker
          v-model="color"
          :default-color="curBg"
          inline
          class="rounded-2xl overflow-hidden cursor-pointer"
          format="rgb"
          @change="
            (color) => {
              const { r, g, b } = color.value
              curBg = get0xRgb(r, g, b)
              avatar.setBackground({
                type: curTab,
                value: curBg
              })
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
        <ImageItem
          v-for="bg in backgroundImages[curTab]"
          :key="bg.src"
          :bg="bg"
          class="w-[180px] h-[180px]"
          :active="curBg === bg.src"
          @click="
            () => {
              curBg = bg.src
              avatar.setBackground({
                type: curTab,
                value: bg.src
              })
            }
          "
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
