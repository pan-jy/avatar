import { AxesHelper, Color, Fog, GridHelper, Mesh, MeshPhongMaterial, PlaneGeometry } from 'three'
import { Base } from './Base'

export class ModelPreview extends Base {
  constructor(container: HTMLElement) {
    super(container)

    // 创建场景
    this.scene.background = new Color('skyblue')
    this.scene.fog = new Fog(this.scene.background, ModelPreview.FAR / 2, ModelPreview.FAR) // 添加雾化效果

    // 添加地面
    this.#createGound()

    // 设置控制器
    this.controls.maxPolarAngle = Math.PI / 2
    this.controls.minPolarAngle = Math.PI / 9
    this.controls.enableDamping = true
    this.controls.maxDistance = 10
    this.controls.minDistance = 0.5
    this.controls.target.set(0, 1, 0)

    // 添加坐标轴、网格
    this.scene.add(
      new AxesHelper(ModelPreview.FAR),
      new GridHelper(ModelPreview.FAR, ModelPreview.FAR)
    )
  }

  #createGound() {
    const ground = new Mesh(
      new PlaneGeometry(ModelPreview.FAR, ModelPreview.FAR),
      new MeshPhongMaterial({ color: 0x8d8d8d, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    this.scene.add(ground)
  }
}
