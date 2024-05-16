import { ModelInfo, ModelList, getModelList } from '@renderer/common/config/modelConfig'
import {
  BackgroundImage,
  BackgroundImageList,
  getBackgroundList
} from '@renderer/common/config/backgroundConfig'
import { InjectionKey, ref, toRaw } from 'vue'
import { BackgroundType } from '../three/Avatar'
import { ChartLetList, getChartletList } from './chartletConfig'

export const configKey = Symbol() as InjectionKey<Config>

export class Config {
  modelList = ref<ModelList>([])
  backgroundImages = ref<BackgroundImageList>([])
  chartletList = ref<ChartLetList>([])

  constructor() {
    this.initModelList()
    this.initBackground()
    this.initChartlet()
  }

  async initModelList() {
    const modelList = await window.electron.ipcRenderer.invoke('get-store', 'modelList')
    if (modelList) this.modelList.value = modelList
    else {
      const ModelList = await getModelList()
      window.electron.ipcRenderer.invoke('set-store', 'modelList', ModelList)
      window.electron.ipcRenderer.invoke('set-store', 'modelInfo', ModelList[0])
      this.modelList.value = ModelList
    }
  }

  async uploadModel(model: ModelInfo) {
    if (this.modelList.value.some((item) => item.path === model.path))
      throw new Error('该模型已存在')
    this.modelList.value.unshift(model)
    await window.electron.ipcRenderer.invoke('set-store', 'modelList', toRaw(this.modelList.value))
  }

  async deleteModel(model: ModelInfo) {
    this.modelList.value = toRaw(this.modelList.value).filter(
      (item) => !item.userUpload && item.path !== model.path && item.name !== model.name
    )
    await window.electron.ipcRenderer.invoke('set-store', 'modelList', toRaw(this.modelList.value))
  }

  async modifyModel(model: ModelInfo) {
    this.modelList.value = toRaw(this.modelList.value).map((item) => {
      if (item.path === model.path) return model
      return item
    })
    await window.electron.ipcRenderer.invoke('set-store', 'modelList', toRaw(this.modelList.value))
  }

  async initBackground() {
    const backgroundList = await window.electron.ipcRenderer.invoke('get-store', 'backgroundList')
    if (backgroundList) this.backgroundImages.value = backgroundList
    else {
      const backgroundImages = await getBackgroundList()
      window.electron.ipcRenderer.invoke('set-store', 'backgroundList', backgroundImages)
      window.electron.ipcRenderer.invoke('set-store', 'background', {
        type: BackgroundType['2d'],
        value: backgroundImages[0][0].src
      })
      this.backgroundImages.value = backgroundImages
    }
  }

  /**
   *
   * @param type 0: 2d, 1: 3d
   * @param {BackgroundImage} background
   */
  async uploadBackground(type: number, background: BackgroundImage) {
    if (type !== 0 && type !== 1) throw new Error()
    if (this.backgroundImages.value[type].some((item) => item.src === background.src))
      throw new Error('该背景已存在')
    this.backgroundImages.value[type].unshift(background)
    await window.electron.ipcRenderer.invoke(
      'set-store',
      'backgroundList',
      toRaw(this.backgroundImages.value)
    )
  }

  async deleteBackground(type: number, background: BackgroundImage) {
    // this.backgroundImages.value[type] = toRaw(this.backgroundImages.value[type]).filter(
    // (item) => item.src !== background.src
    // )
    this.backgroundImages.value[type].splice(
      this.backgroundImages.value[type].findIndex((item) => item.src === background.src),
      1
    )
    await window.electron.ipcRenderer.invoke(
      'set-store',
      'backgroundList',
      toRaw(this.backgroundImages.value)
    )
  }

  async initChartlet() {
    const chartletList = await window.electron.ipcRenderer.invoke('get-store', 'chartletList')
    if (chartletList) this.chartletList.value = chartletList
    else {
      const list = await getChartletList()
      window.electron.ipcRenderer.invoke('set-store', 'chartletList', list)
      this.chartletList.value = list
    }
  }
}
