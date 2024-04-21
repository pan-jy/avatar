import {
  Bone,
  DirectionalLight,
  Group,
  HemisphereLight,
  Object3D,
  Object3DEventMap,
  PerspectiveCamera,
  Scene,
  SkeletonHelper,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRMLoaderPlugin, VRMUtils, VRM, VRMHumanBoneName } from '@pixiv/three-vrm'

export type ModelFileType = 'gltf' | 'vrm' | 'fbx'

export class Base {
  scene: Scene
  controls: OrbitControls
  #camera: PerspectiveCamera
  #renderer: WebGLRenderer
  #container: HTMLElement
  animateCallbacks: Array<() => void> = []
  static FAR = 30

  model: Group<Object3DEventMap> | null = null
  bonesMap: Map<VRMHumanBoneName, Bone<Object3DEventMap>> = new Map()

  constructor(container: HTMLElement) {
    if (!container) throw new Error('container is required')

    this.#container = container
    // 创建相机
    this.#camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, Base.FAR)
    this.#camera.position.set(0, 1, 5)

    // 创建场景
    this.scene = new Scene()

    // 添加灯光
    this.#createLights()

    // 创建 WebGLRenderer
    this.#renderer = new WebGLRenderer({ antialias: true }) // 抗锯齿
    this.#renderer.shadowMap.enabled = true

    // 初始化窗口大小
    const { clientWidth: width, clientHeight: height } = this.#container
    this.setSize(width, height)

    // 创建控制器
    this.controls = new OrbitControls(this.#camera, this.#renderer.domElement)

    // 将渲染器的 canvas 添加到容器中
    container.append(this.#renderer.domElement)
  }

  setSize(width = this.#container.clientWidth, height = this.#container.clientHeight) {
    // 更新相机的宽高比
    this.#camera.aspect = width / height
    // 更新相机的投影矩阵
    this.#camera.updateProjectionMatrix()
    // 更新渲染器的大小
    this.#renderer.setSize(width, height)
    // 更新渲染器的像素比
    this.#renderer.setPixelRatio(window.devicePixelRatio)
  }

  start() {
    this.#renderer.setAnimationLoop(() => {
      this.controls.update()
      this.#renderer.render(this.scene, this.#camera)
      this.animateCallbacks.forEach((callback) => callback())
    })
  }

  // 清空场景
  clear() {
    this.scene.clear()
  }

  dispose() {
    this.#renderer.domElement.remove()
    this.#renderer.dispose()
    this.controls.dispose()
  }

  #createLights() {
    const dirLight = new DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 5, 5)
    dirLight.castShadow = true

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0) // 上方

    this.scene.add(dirLight, hemiLight)
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
      vrm.humanoid.autoUpdateHumanBones = false

      return vrm
    } else return gltf
  }

  async loadFBXModel(path: string) {
    const loader = new FBXLoader()
    const model = await loader.loadAsync(path)
    // fbx 格式的模型单位是 cm，需要缩小 100 倍
    model.scale.set(0.01, 0.01, 0.01)

    return model
  }

  async loadModel(path: string) {
    if (this.model) {
      this.scene.remove(this.model)
      this.bonesMap.clear()
      this.animateCallbacks = []
    }

    const fileType = path.split('.').pop()?.toLowerCase()
    if (fileType !== 'fbx' && fileType !== 'gltf' && fileType !== 'vrm')
      throw new Error('Unsupported file type')

    let model: Group<Object3DEventMap>
    let drivingModel: Group<Object3DEventMap> | VRM
    if (fileType === 'fbx') {
      model = await this.loadFBXModel(path)
      drivingModel = model
    } else {
      const temp = await this.loadGLTFModel(path, fileType)
      model = temp.scene
      drivingModel = fileType === 'vrm' ? <VRM>temp : model
    }

    this.model = model
    console.log(model)
    this.scene.add(model)

    if (fileType !== 'vrm') {
      ;(<Group<Object3DEventMap>>drivingModel).userData.type = fileType
      const hips = this.#getHips(
        model.getObjectByProperty('type', 'Bone') as Bone<Object3DEventMap>
      )
      try {
        this.boneMapping(hips, this.bonesMap)
      } catch (error) {
        console.error(error)
      }
    }

    return drivingModel
  }

  #getHips(bone: Bone<Object3DEventMap>) {
    if (bone.name.toLowerCase().includes('hip')) return bone
    for (const child of bone.children as Bone<Object3DEventMap>[]) {
      const hip = this.#getHips(child)
      if (hip) return hip
    }
  }

  #deleteInvalidBones(bone: Bone<Object3DEventMap>) {
    const traverseBone = (
      bone: Bone<Object3DEventMap>,
      callback: (bone: Bone<Object3DEventMap>) => void
    ) => {
      callback(bone)
      const children = bone.children
      for (let i = children.length - 1; i >= 0; i--) {
        traverseBone(children[i] as Bone<Object3DEventMap>, callback)
      }
    }
    traverseBone(bone, (bone: Bone<Object3DEventMap>) => {
      const { x, y, z } = bone.position
      const isValid =
        bone.visible && (x !== 0 || y !== 0 || z !== 0) && !bone.name.toLowerCase().includes('sec')
      if (!isValid) bone.removeFromParent()
    })
    return bone
  }

  boneMapping(
    hips: Bone<Object3DEventMap>,
    map: Map<VRMHumanBoneName, Object3D<Object3DEventMap>>
  ) {
    hips = this.#deleteInvalidBones(hips)
    map.set(VRMHumanBoneName.Hips, hips)

    const skeleton = new SkeletonHelper(hips)
    const bones = skeleton.bones
    console.log(bones)

    const [leftUpperLeg, spine, rightUpperLeg] = <Bone<Object3DEventMap>[]>hips.children
      .filter(({ name }) => !name.toLowerCase().includes('tail')) // 部分模型有尾巴骨骼
      .sort((a, b) => b.position.x - a.position.x)

    // 脊椎
    map.set(VRMHumanBoneName.Spine, spine)
    const chest = spine.children[0]
    map.set(VRMHumanBoneName.Chest, chest)
    const upperChest = chest.children[0]
    map.set(VRMHumanBoneName.UpperChest, upperChest)
    const upperChestChildren = upperChest.children.sort((a, b) => b.position.x - a.position.x)
    // 颈部
    const neck = upperChestChildren[upperChestChildren.length >> 1]
    map.set(VRMHumanBoneName.Neck, neck)
    // 头部
    const head = neck.children[0]
    map.set(VRMHumanBoneName.Head, head)

    // 左大腿
    map.set(VRMHumanBoneName.LeftUpperLeg, leftUpperLeg)
    // 左膝盖
    const leftLowerLeg = leftUpperLeg.children[0]
    map.set(VRMHumanBoneName.LeftLowerLeg, leftLowerLeg)
    // 左脚踝
    const leftFoot = leftLowerLeg.children[0]
    map.set(VRMHumanBoneName.LeftFoot, leftFoot)
    // 右大腿
    map.set(VRMHumanBoneName.RightUpperLeg, rightUpperLeg)
    // 右膝盖
    const rightLowerLeg = rightUpperLeg.children[0]
    map.set(VRMHumanBoneName.RightLowerLeg, rightLowerLeg)
    // 右脚踝
    const rightFoot = rightLowerLeg.children[0]
    map.set(VRMHumanBoneName.RightFoot, rightFoot)

    // 左肩
    const leftShoulder = upperChestChildren[0]
    map.set(VRMHumanBoneName.LeftShoulder, leftShoulder)
    // 左上臂
    const leftUpperArm = leftShoulder.children[0]
    map.set(VRMHumanBoneName.LeftUpperArm, leftUpperArm)
    // 左手肘
    const leftLowerArm = leftUpperArm.children[0]
    map.set(VRMHumanBoneName.LeftLowerArm, leftLowerArm)
    // 左手腕
    const leftHand = leftLowerArm.children[0]
    map.set(VRMHumanBoneName.LeftHand, leftHand)

    // 右肩
    const rightShoulder = upperChestChildren[upperChestChildren.length - 1]
    map.set(VRMHumanBoneName.RightShoulder, rightShoulder)
    // 右上臂
    const rightUpperArm = rightShoulder.children[0]
    map.set(VRMHumanBoneName.RightUpperArm, rightUpperArm)
    // 右手肘
    const rightLowerArm = rightUpperArm.children[0]
    map.set(VRMHumanBoneName.RightLowerArm, rightLowerArm)
    // 右手腕
    const rightHand = rightLowerArm.children[0]
    map.set(VRMHumanBoneName.RightHand, rightHand)

    for (const bone of map.values()) {
      if (
        Math.abs(bone.rotation.x) <= 0.01 &&
        Math.abs(bone.rotation.y) <= 0.01 &&
        Math.abs(bone.rotation.z) <= 0.01
      )
        continue
      this.#addTBone(bone)
    }

    this.model!.userData.bonesMap = map
    console.log(map)
  }

  #addTBone(bone: Object3D<Object3DEventMap>) {
    const t = new Bone()
    t.position.copy(bone.position)
    t.rotation.copy(bone.rotation)
    bone.position.set(0, 0, 0)
    bone.rotation.set(0, 0, 0)
    bone.parent!.children.filter((child) => child !== bone)
    bone.parent!.add(t)
    t.add(bone)
  }
}
