<template>
  <svg :style="iconStyle" aria-hidden="true">
    <use :xlink:href="symbolId" />
  </svg>
</template>

<script setup lang="ts">
import { CSSProperties, computed } from 'vue'

interface SvgProps {
  name: string
  prefix?: string
  iconStyle?: CSSProperties
}
// 接收父组件参数并设置默认值
const props = withDefaults(defineProps<SvgProps>(), {
  prefix: 'icon'
})

const symbolId = computed(() => `#${props.prefix}-${props.name}`)
</script>
