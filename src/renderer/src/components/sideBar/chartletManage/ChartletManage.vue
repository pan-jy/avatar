<script setup lang="ts">
import { configKey } from '@renderer/common/config/Config'
import { Avatar } from '@renderer/common/three/Avatar'
import { inject, ref } from 'vue'

const props = defineProps<{
  avatar: Avatar
}>()

const config = inject(configKey)!
const chartletList = config.chartletList

const chartLets = ref(props.avatar.chartletList)

function clearChartLets() {
  chartLets.value = []
  props.avatar.renderChartlets([])
}
</script>

<template>
  <div class="w-[150px] h-full">
    <PrButton label="清空选择" class="block mb-4" @click="clearChartLets" />
    <PrAccordion
      lazy
      :active-index="0"
      pt:headeraction:class="text-white"
      class="overflow-x-hidden accordion"
    >
      <PrAccordionTab v-for="{ name, children } in chartletList" :key="name" :header="name">
        <div class="mb-4">
          <PrListbox
            v-model="chartLets"
            :options="children"
            pt:root:class="w-full"
            multiple
            @change="
              ({ value }) => {
                avatar.renderChartlets(value)
              }
            "
          >
            <template #option="slotProps">
              <ImageItem
                :image="slotProps.option"
                object-fit="contain"
                :active="
                  chartLets.find(({ name }) => slotProps?.option?.name === name) !== undefined
                "
                active-class="bg-primary-300"
                class="w-[120px] h-[120px] p-2"
              />
            </template>
          </PrListbox>
        </div>
      </PrAccordionTab>
    </PrAccordion>
  </div>
</template>
