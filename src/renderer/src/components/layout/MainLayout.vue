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
        <RouterLink
          class="flex items-center px-2 py-1 mx-2 rounded-md"
          :to="item.url"
          v-bind="props.action"
          :class="
            route.path === item.url
              ? 'bg-primary-100 text-primary-500 dark:bg-surface-700 dark:text-primary-300'
              : 'hover:bg-surface-100 dark:hover:bg-surface-600'
          "
        >
          <i class="pi mt-[0.5px]" :class="item.icon" />
          <span class="ml-1">{{ item.label }}</span>
        </RouterLink>
      </template>
      <template #end>
        <div @click="tuggleTheme">
          <i v-if="theme === 'light'" class="pi pi-sun text-xl" />
          <i v-else class="pi pi-moon text-xl text-primary-500" />
        </div>
      </template>
    </PrMenubar>
  </header>

  <main class="flex-1 p-4">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menus = ref([
  { label: '模型库', icon: 'pi-box', url: '/model-library' },
  { label: '动作捕捉', icon: 'pi-camera', url: '/action-capture' },
  { label: '设置', icon: 'pi-cog', url: '/settings' }
])

const theme = ref<'light' | 'dark'>((localStorage.theme as 'light' | 'dark') || 'light')

function tuggleTheme() {
  document.documentElement.classList.toggle('dark')
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}
</script>
