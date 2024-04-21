<template>
  <div class="flex flex-row w-full h-full">
    <div ref="container" class="flex-1 overflow-hidden min-w-[500px]"></div>
    <div class="w-[350px] flex flex-col px-2 pb-2 h-full overflow-auto">
      <PrAccordion :multiple="true">
        <PrAccordionTab v-for="bone in bones" :key="bone.uuid" :header="bone.name">
          <div class="flex justify-between">
            <Knob
              v-for="key in ['x', 'y', 'z']"
              :key="key"
              v-model="bone.rotation[key]"
              :label="key"
            />
          </div>
        </PrAccordionTab>
      </PrAccordion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModelPreview } from '@renderer/common/three/ModelPreview'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bone, Group, Object3DEventMap } from 'three'
import { useThrottleFn } from '@vueuse/core'

const route = useRoute()
const model = ref<Group<Object3DEventMap> | null>()

const container = ref<HTMLDivElement | null>(null)

let onResize: () => void
let modelPreview: ModelPreview
onMounted(async () => {
  if (!container.value) return
  const { path } = route.query
  try {
    modelPreview = new ModelPreview(container.value)
    // 监听窗口大小变化
    onResize = useThrottleFn(() => {
      modelPreview.setSize()
    }, 100)
    window.addEventListener('resize', onResize)
    // 渲染
    modelPreview.start()
    await modelPreview.loadModel(path as string)
    model.value = modelPreview.model
  } catch (error) {
    alert(error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  modelPreview.dispose()
})

const bones = computed(() => {
  if (!model.value) return []
  const bones: Bone[] = []
  model.value.traverse(function (bone) {
    if ((bone as Bone).isBone && bone.name) {
      bones.push(bone as Bone)
    }
  })
  return bones
})
</script>
