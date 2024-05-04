import { PresetModelList, presetModelList } from '@renderer/common/config/modelConfig'
import { BackgroundImage, backgroundImages } from '@renderer/common/config/backgroundConfig'
import { InjectionKey } from 'vue'
import { BackgroundType } from '../three/Avatar'

export const configKey = Symbol() as InjectionKey<Config>

export class Config {
  modelList: PresetModelList = []
  backgroundImages: BackgroundImage[][] = []

  constructor() {
    this.initModelList()
    this.initBackground()
  }

  async initModelList() {
    const modelList = await window.electron.ipcRenderer.invoke('get-store', 'modelList')
    if (modelList) this.modelList = modelList
    else {
      window.electron.ipcRenderer.invoke('set-store', 'modelList', presetModelList)
      window.electron.ipcRenderer.invoke('set-store', 'modelInfo', presetModelList[0])
      this.modelList = presetModelList
    }
  }

  async initBackground() {
    const backgroundList = await window.electron.ipcRenderer.invoke('get-store', 'backgroundList')
    if (backgroundList) this.backgroundImages = backgroundList
    else {
      window.electron.ipcRenderer.invoke('set-store', 'backgroundList', backgroundImages)
      window.electron.ipcRenderer.invoke('set-store', 'background', {
        type: BackgroundType['2d'],
        value: backgroundImages[0][0].src
      })
      this.backgroundImages = backgroundImages
    }
  }
}
