<template>
  <div>
    <section class="mb-4">
      <h2 class="text-lg font-mono font-bold">用户模型</h2>
      <div
        class="py-2 grid gap-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1"
      >
        <div class="min-w-[300px] h-[136px] relative flex-shrink-0">
          <PrFileUpload :custom-upload="true">
            <template #header="{ chooseCallback, files }">
              <i
                v-show="files.length === 0"
                class="pi pi-cloud-upload border-2 rounded-full p-4 text-4xl mt-4"
                @click="chooseCallback()"
              />
            </template>
            <template #empty>
              <p class="mt-20 text-center">拖动或点击按钮上传模型</p>
            </template>
          </PrFileUpload>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-mono font-bold">内置模型</h2>
      <div class="py-2 grid gap-2 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
        <div
          v-for="model in PresetModelList"
          :key="model.name"
          class="relative flex flex-shrink-0 items-center overflow-hidden border border-surface-200 dark:border-surface-700 rounded-2xl cursor-pointer min-w-[300px] h-[136px]"
          @click="handelClick(model.path)"
        >
          <img :src="model.cover" class="h-full -ml-4" />
          <div
            class="h-full absolute w-10/12 right-0 flex justify-end items-center bg-gradient-to-r from-transparent from-20% via-surface-100 via-40% to-surface-100 dark:from-transparent dark:via-surface-500 dark:to-surface-500"
          >
            <div class="mr-6 flex flex-col items-end gap-4">
              <p class="text-xl">{{ model.name }}</p>
              <p class="text-xs">点击查看</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { PresetModelList } from '@renderer/common/modelConfig'

function handelClick(path: string) {
  if (path) window.electron.ipcRenderer.invoke('open-new-win', `/model?path=${path}`)
}
</script>
