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
import { ModelPreview } from '@renderer/three/ModelPreview'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bone, Group, Object3DEventMap } from 'three'

const route = useRoute()
const model = ref<Group<Object3DEventMap> | null>()

const container = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (!container.value) return
  const { path } = route.query
  try {
    const modelPreview = new ModelPreview(container.value)
    modelPreview.start()
    model.value = await modelPreview.loadModel(path as string)
  } catch (error) {
    alert(error)
  }
})

const bones = computed(() => {
  if (!model.value) return []
  const bones: Bone[] = []
  model.value.traverse(function (bone) {
    if ((bone as Bone).isBone) {
      bones.push(bone as Bone)
    }
  })
  return bones
})
</script>
