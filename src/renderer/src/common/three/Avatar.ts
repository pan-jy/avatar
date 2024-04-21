import { AxesHelper, Clock, Color, GridHelper } from 'three'
import { Base, ModelFileType } from './Base'
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ModelPreview } from './ModelPreview'

export class Avatar extends Base {
  constructor(container: HTMLElement) {
    super(container)
    this.scene.background = new Color('#6b7280')

    // 设置控制器
    this.controls.maxDistance = 10
    this.controls.minDistance = 0.5
    this.controls.target.set(0, 1, 0)

    // 添加坐标轴、网格
    this.scene.add(
      new AxesHelper(ModelPreview.FAR),
      new GridHelper(ModelPreview.FAR, ModelPreview.FAR)
    )
  }

  async loadGLTFModel(path: string, fileType: Exclude<ModelFileType, 'fbx'>) {
    const loader = new GLTFLoader()
    fileType === 'vrm' && loader.register((parser) => new VRMLoaderPlugin(parser))

    const gltf = await loader.loadAsync(path)

    if (fileType === 'vrm') {
      // 优化模型, 提升性能
      VRMUtils.removeUnnecessaryJoints(gltf.scene)
      VRMUtils.removeUnnecessaryVertices(gltf.scene)
      const vrm = gltf.userData.vrm as VRM
      // 朝向 Y+
      VRMUtils.rotateVRM0(vrm)

      const clock = new Clock()
      this.animateCallbacks.push(vrm.update.bind(vrm, clock.getDelta()))
      return vrm
    } else return gltf
  }
}
