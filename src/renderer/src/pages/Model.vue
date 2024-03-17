<template>
  <div class="flex flex-row w-full h-full">
    <div ref="container" class="flex-1 overflow-hidden min-w-[500px]"></div>
    <div class="w-[350px] flex flex-col px-2 pb-2 h-full overflow-auto">
      <ConfigProvider
        :theme="{
          algorithm: theme.compactAlgorithm
        }"
      >
        <Collapse>
          <CollapsePanel header="模型旋转">
            <Collapse ghost>
              <CollapsePanel v-for="bone in bones" :key="bone.uuid" :header="bone.name">
                <Form>
                  <Form.Item v-for="key in ['x', 'y', 'z']" :key="key" :label="`R.${key}`">
                    <div class="flex">
                      <Slider
                        v-model:value="bone.rotation[key]"
                        class="flex-1"
                        :step="0.01"
                        :min="-3.14"
                        :max="3.14"
                        show-input
                        :tip-formatter="
                          () => {
                            return `${((bone.rotation[key] * 180) / 3.14).toFixed(2)}°`
                          }
                        "
                      />
                      <InputNumber
                        v-model:value="bone.rotation[key]"
                        class="w-[60px] ml-2"
                        :step="0.01"
                        :min="-3.14"
                        :max="3.14"
                      />
                    </div>
                  </Form.Item>
                </Form>
              </CollapsePanel>
            </Collapse>
          </CollapsePanel>
        </Collapse>
      </ConfigProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModelPreview } from '@renderer/three/ModelPreview'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Collapse,
  CollapsePanel,
  Form,
  Slider,
  InputNumber,
  ConfigProvider,
  theme
} from 'ant-design-vue'
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

// function openDevTools() {
//   window.electron.ipcRenderer.send('open-dev-tools')
// }
</script>

<style>
.ant-collapse > .ant-collapse-item > .ant-collapse-header {
  padding: 4px;
}
.ant-collapse .ant-collapse-content > .ant-collapse-content-box {
  padding: 0;
}

.ant-collapse-ghost > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
  padding-block: 0;
  padding: 0px 8px;
}
.ant-form-item {
  margin-bottom: 4px;
}
</style>
