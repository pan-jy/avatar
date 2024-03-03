<template>
  <header></header>
  <aside
    class="flex flex-col shrink-0 bg-[rgb(73,57,113)] text-white transition-all"
    :class="isExpand ? 'w-60' : 'w-20'"
  >
    <!-- logo -->
    <div
      class="cursor-pointer px-2 py-4 flex items-center justify-center"
      @click="changeMenu(menus[0])"
    >
      <span v-if="isExpand" class="text-xl font-bold font-serif">AVATAR</span>
      <SvgIcon v-else class="w-12 h-12" name="logo-bone" />
    </div>
    <!-- menu -->
    <div
      class="flex items-center ml-2 py-1 my-1 gap-4 text-base cursor-pointer hover:bg-[rgb(154,154,175)] hover:rounded-s-lg transition-all"
      :class="[
        activeMenu === menu.id && [
          'bg-white',
          'text-black',
          'rounded-l-xl',
          'py-2',
          'font-bold',
          'hover:bg-white',
          'hover:rounded-l-xl'
        ],
        isExpand ? ['pl-4'] : ['pr-2', 'justify-center']
      ]"
      v-for="menu in menus"
      :key="menu.id"
      @click="changeMenu(menu)"
    >
      <SvgIcon class="w-5 h-5" :name="menu.icon" />
      <span v-show="isExpand">{{ menu.title }}</span>
    </div>
    <!-- expand/collapse -->
    <div class="flex-1 flex items-end p-4" :class="isExpand ? 'justify-end' : 'justify-center'">
      <SvgIcon
        class="w-6 h-6"
        :class="isExpand ? 'rotate-180' : 'rotate-0'"
        name="menu-expand"
        @click="isExpand = !isExpand"
      />
    </div>
  </aside>
  <main class="flex-1">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '../common/SvgIcon.vue'

const menus = [
  { id: 1, title: '模型库', icon: 'menu-library', path: '/model-library' },
  { id: 2, title: '动作捕捉', icon: 'menu-capture', path: '/action-capture' },
  { id: 3, title: '设置', icon: 'menu-settings', path: '/settings' }
]

const router = useRouter()
const activeMenu = ref(1)
const isExpand = ref(true)

function changeMenu({ id, path }) {
  activeMenu.value = id
  router.push(path)
}
</script>
