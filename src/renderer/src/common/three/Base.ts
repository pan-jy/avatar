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
import { useElementSize, useThrottleFn } from '@vueuse/core'
import { watch } from 'vue'

export type ModelFileType = 'glb' | 'vrm' | 'fbx'

export class Base {
  scene: Scene
  controls: OrbitControls
  camera: PerspectiveCamera
  #container: HTMLElement
  renderer: WebGLRenderer
  animateCallbacks: Array<() => void> = []
  static FAR = 30

  model: Group<Object3DEventMap> | null = null
  bonesMap: Map<VRMHumanBoneName, Bone<Object3DEventMap>> = new Map()

  constructor(container: HTMLElement) {
    if (!container) throw new Error('container is required')

    this.#container = container
    // 创建相机
    this.camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, Base.FAR)
    this.camera.position.set(0, 1, 5)

    // 创建场景
    this.scene = new Scene()

    // 添加灯光
    this.#createLights()

    // 创建 WebGLRenderer
    this.renderer = new WebGLRenderer({ antialias: true }) // 抗锯齿
    this.renderer.shadowMap.enabled = true

    // 监听容器大小
    this.watchSize()

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    // 将渲染器的 canvas 添加到容器中
    container.append(this.renderer.domElement)
  }

  watchSize() {
    const { width, height } = useElementSize(this.#container)
    const containerSize = [width, height]
    watch(
      containerSize,
      useThrottleFn(
        ([width, height]) => {
          // 更新相机的宽高比
          this.camera.aspect = width / height
          // 更新相机的投影矩阵
          this.camera.updateProjectionMatrix()
          // 更新渲染器的大小
          this.renderer.setSize(width, height)
          // 更新渲染器的像素比
          this.renderer.setPixelRatio(window.devicePixelRatio)
        },
        300,
        true
      ),
      { immediate: true }
    )
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.animateCallbacks.forEach((callback) => callback())
    })
  }

  // 清空场景
  clear() {
    this.scene.clear()
  }

  dispose() {
    this.renderer.domElement.remove()
    this.renderer.dispose()
    this.controls.dispose()
  }

  #createLights() {
    const dirLight = new DirectionalLight(0xffffff, 2)
    dirLight.position.set(5, 5, 5)
    dirLight.castShadow = true

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 2)
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
    if (fileType !== 'fbx' && fileType !== 'glb' && fileType !== 'vrm')
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
      const isValid = this.#isValideBone(bone)
      if (!isValid) bone.removeFromParent()
    })
    return bone
  }

  #isValideBone(bone: Bone<Object3DEventMap>) {
    const { x, y, z } = bone.position
    return (
      bone.visible && (x !== 0 || y !== 0 || z !== 0) && !bone.name.toLowerCase().includes('sec')
    )
  }

  boneMapping(
    hips: Bone<Object3DEventMap>,
    map: Map<VRMHumanBoneName, Object3D<Object3DEventMap>>
  ) {
    const tempHips = this.#deleteInvalidBones(hips.clone())
    const tempMap = new Map<string, VRMHumanBoneName>()
    tempMap.set(tempHips.name, VRMHumanBoneName.Hips)

    const skeleton = new SkeletonHelper(tempHips)
    const bones = skeleton.bones
    console.log(bones)

    if (tempHips.children.length !== 3) {
      tempHips.children = tempHips.children.filter(
        ({ name }) => name.toLowerCase().includes('leg') || name.toLowerCase().includes('spine')
      )
    }

    const [leftUpperLeg, spine, rightUpperLeg] = <Bone<Object3DEventMap>[]>(
      tempHips.children.sort((a, b) => b.position.x - a.position.x)
    )

    // 脊椎
    tempMap.set(spine.name, VRMHumanBoneName.Spine)
    const chest = spine.children[0]
    tempMap.set(chest.name, VRMHumanBoneName.Chest)
    const upperChest = chest.children[0]
    tempMap.set(upperChest.name, VRMHumanBoneName.UpperChest)
    const upperChestChildren = upperChest.children.sort((a, b) => b.position.x - a.position.x)
    // 颈部
    const neck = upperChestChildren[upperChestChildren.length >> 1]
    tempMap.set(neck.name, VRMHumanBoneName.Neck)
    // 头部
    const head = neck.children[0]
    tempMap.set(head.name, VRMHumanBoneName.Head)

    // 左大腿
    tempMap.set(leftUpperLeg.name, VRMHumanBoneName.LeftUpperLeg)
    // 左膝盖
    const leftLowerLeg = leftUpperLeg.children[0]
    tempMap.set(leftLowerLeg.name, VRMHumanBoneName.LeftLowerLeg)
    // 左脚踝
    const leftFoot = leftLowerLeg.children[0]
    tempMap.set(leftFoot.name, VRMHumanBoneName.LeftFoot)
    // 右大腿
    tempMap.set(rightUpperLeg.name, VRMHumanBoneName.RightUpperLeg)
    // 右膝盖
    const rightLowerLeg = rightUpperLeg.children[0]
    tempMap.set(rightLowerLeg.name, VRMHumanBoneName.RightLowerLeg)
    // 右脚踝
    const rightFoot = rightLowerLeg.children[0]
    tempMap.set(rightFoot.name, VRMHumanBoneName.RightFoot)

    // 左肩
    const leftShoulder = upperChestChildren[0]
    tempMap.set(leftShoulder.name, VRMHumanBoneName.LeftShoulder)
    // 左上臂
    const leftUpperArm = leftShoulder.children[0]
    tempMap.set(leftUpperArm.name, VRMHumanBoneName.LeftUpperArm)
    // 左手肘
    const leftLowerArm = leftUpperArm.children[0]
    tempMap.set(leftLowerArm.name, VRMHumanBoneName.LeftLowerArm)
    // 左手腕
    const leftHand = leftLowerArm.children[0]
    tempMap.set(leftHand.name, VRMHumanBoneName.LeftHand)

    // 右肩
    const rightShoulder = upperChestChildren[upperChestChildren.length - 1]
    tempMap.set(rightShoulder.name, VRMHumanBoneName.RightShoulder)
    // 右上臂
    const rightUpperArm = rightShoulder.children[0]
    tempMap.set(rightUpperArm.name, VRMHumanBoneName.RightUpperArm)
    // 右手肘
    const rightLowerArm = rightUpperArm.children[0]
    tempMap.set(rightLowerArm.name, VRMHumanBoneName.RightLowerArm)
    // 右手腕
    const rightHand = rightLowerArm.children[0]
    tempMap.set(rightHand.name, VRMHumanBoneName.RightHand)

    hips.traverse((bone) => {
      if (tempMap.has(bone.name) && this.#isValideBone(<Bone<Object3DEventMap>>bone))
        map.set(tempMap.get(bone.name)!, bone)
    })

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
