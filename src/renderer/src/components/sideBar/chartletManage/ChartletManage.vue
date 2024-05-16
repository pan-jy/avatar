<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import { inject } from 'vue'

const config = inject(configKey)!
const chartletList = config.chartletList
</script>

<template>
  <div class="w-[150px] h-full">
    <PrAccordion lazy class="overflow-x-hidden accordion" pt:headeraction:class="text-white">
      <PrAccordionTab v-for="{ name, children } in chartletList" :key="name" :header="name">
        <div class="flex flex-col gap-4 w-full items-center justify-center mb-4">
          <ImageItem
            v-for="item in children"
            :key="item.name"
            :image="item"
            object-fit="contain"
            class="w-[120px] h-[120px] bg-transparent p-2"
          />
        </div>
      </PrAccordionTab>
    </PrAccordion>
  </div>
</template>
