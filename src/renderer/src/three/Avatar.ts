import { Color } from 'three'
import { Base } from './Base'

export class Avatar extends Base {
  constructor(container: HTMLElement) {
    super(container)
    this.scene.background = new Color('#6b7280')

    // 设置控制器
    this.controls.maxDistance = 10
    this.controls.minDistance = 0.5
    this.controls.target.set(0, 1, 0)
  }
}
