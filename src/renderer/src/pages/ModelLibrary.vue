<template>
  <div>
    <section>
      <h2 class="text-lg font-mono font-bold">用户模型</h2>
      <div class="py-2">
        <button
          class="px-4 py-2 text-sm border border-sky-500 bg-sky-400 text-white rounded-3xl"
          @click="handelClick"
        >
          打开新窗口
        </button>
      </div>
    </section>
    <section>
      <h2 class="text-lg font-mono font-bold">内置模型</h2>
    </section>
  </div>
</template>

<script setup lang="ts">
function handelClick() {
  console.log('click')
  window.electron.ipcRenderer.invoke('open-new-win', '/model')
}
</script>

<style scoped></style>
