<template>
  <div>
    <section>
      <h2 class="text-lg font-mono font-bold">用户模型</h2>
      <div class="py-2 grid grid-cols-3 gap-2">
        <div
          v-for="model in Models"
          :key="model.name"
          class="flex flex-col items-center border border-sky-400 rounded-xl p-2 cursor-pointer"
          @click="handelClick(model.path)"
        >
          <span class="text-xs">{{ model.name }}</span>
        </div>
      </div>
    </section>
    <section>
      <h2 class="text-lg font-mono font-bold">内置模型</h2>
    </section>
    <Button label="Submit" />
  </div>
</template>

<script setup lang="ts">
const Models = [
  {
    name: 'PeasantGirl',
    path: '/models/fbx/PeasantGirl.fbx'
  },
  {
    name: 'SambaDancing',
    path: '/models/fbx/SambaDancing.fbx'
  },
  {
    name: 'Soldier',
    path: '/models/gltf/Soldier.glb'
  },
  {
    name: 'PureGirl',
    path: '/models/vrm/PureGirl.vrm'
  },
  {
    name: 'Shirai',
    path: '/models/vrm/Shirai.vrm'
  },
  {
    name: 'Sliver',
    path: '/models/vrm/Sliver.vrm'
  },
  {
    name: 'Uniform',
    path: '/models/vrm/Uniform.vrm'
  }
]
function handelClick(path: string) {
  if (path) window.electron.ipcRenderer.invoke('open-new-win', `/model?path=${path}`)
}
</script>

<style scoped></style>
