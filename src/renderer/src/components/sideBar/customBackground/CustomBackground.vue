<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { backgroungImages } from './config'
import type { Avatar } from '@renderer/common/three/Avatar'

const props = defineProps<{
  avatar: Avatar
}>()

const curTab = ref(0)
const curBg = ref(backgroungImages[0])

onMounted(async () => {
  const { type, value } = props.avatar.backgroundConfig
  curTab.value = type
  curBg.value = backgroungImages.find((bg) => bg.src === value) || backgroungImages[0]
})

const tabs = [
  {
    label: '2D',
    icon: 'bg-2D'
  },
  {
    label: '3D',
    icon: 'bg-3D'
  },
  {
    label: '颜色',
    icon: 'bg-palette'
  }
]
</script>

<template>
  <div class="w-[150px] h-full">
    <div class="w-full">
      <div v-if="curTab === 0" class="flex flex-col gap-4 items-center after:h-[60px]">
        <ImageItem
          v-for="bg in backgroungImages"
          :key="bg.src"
          :bg="bg"
          :active="curBg.src === bg.src"
          @click="
            () => {
              curBg = bg
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
