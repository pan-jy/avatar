<template>
  <header>
    <PrMenubar :model="menus">
      <template #start>
        <SvgIcon
          class="w-10 h-10 text-gray-600 cursor-pointer dark:text-surface-200"
          name="logo-bone"
          @click="router.replace('/')"
        />
      </template>
      <template #item="{ item, props }">
        <RouterLink class="flex items-center px-2 py-1 mx-2" :to="item.url" v-bind="props.action">
          <i class="pi w-4 h-4" :class="item.icon"></i>
          <span class="ml-1">{{ item.label }}</span>
        </RouterLink>
      </template>
      <template #end>
        <div class="flex items-center gap-2"></div>
      </template>
    </PrMenubar>
  </header>

  <main class="flex-1 p-4">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const menus = ref([
  { key: 0, label: '模型库', icon: 'pi-box', url: '/model-library' },
  { key: 1, label: '动作捕捉', icon: 'pi-camera', url: '/action-capture' },
  { key: 2, label: '设置', icon: 'pi-cog', url: '/settings' }
])
</script>
