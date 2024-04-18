import {
  Bone,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  Object3DEventMap,
  PerspectiveCamera,
  Scene,
  SkeletonHelper,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as mpHolistic from '@mediapipe/holistic'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'

export class Base {
  scene: Scene
  controls: OrbitControls
  #camera: PerspectiveCamera
  #renderer: WebGLRenderer
  #container: HTMLElement
  static FAR = 30

  model: Group<Object3DEventMap> | null = null
  bonesMap: Map<number, Bone<Object3DEventMap>> = new Map()

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

  async loadGLTFModel(path: string) {
    if (this.model) this.scene.remove(this.model)

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const gltf = await loader.loadAsync(path)
    VRMUtils.removeUnnecessaryJoints(gltf.scene)
    const vrm = gltf.userData.vrm
    // 朝向镜头
    VRMUtils.rotateVRM0(vrm)

    const clock = new Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      if (vrm) vrm.update(clock.getDelta())
    }
    animate()

    const model = vrm.scene
    this.model = model

    this.scene.add(model)

    return vrm
  }

  // async #loadFBXModel(path: string) {
  //   const loader = new FBXLoader()
  //   const model = await loader.loadAsync(path)
  //   // fbx 格式的模型单位是 cm，需要缩小 100 倍
  //   model.scale.set(0.01, 0.01, 0.01)
  //   // 朝向镜头
  //   // model.rotation.y = Math.PI
  //   return model
  // }

  // async loadModel(path: string) {
  //   if (this.model) this.scene.remove(this.model)
  //   const extName = path.split('.').pop()
  //   let model: Group<Object3DEventMap>
  //   if (extName === 'fbx') {
  //     model = await this.#loadFBXModel(path)
  //   } else {
  //     model = await this.loadGLTFModel(path)
  //   }
  //   this.model = model
  //   console.log(model)

  //   this.scene.add(model)

  //   // 获取臀部中心骨骼
  //   // const hips = this.getHips(model.getObjectByProperty('type', 'Bone') as Bone<Object3DEventMap>)
  //   // try {
  //   //   this.boneMapping(hips, this.bonesMap)
  //   // } catch (error) {
  //   //   console.error(error)
  //   // }

  //   return model
  // }

  getHips(bone: Bone<Object3DEventMap>) {
    if (bone.name.toLowerCase().includes('hip')) return bone
    for (const child of bone.children as Bone<Object3DEventMap>[]) {
      const hip = this.getHips(child)
      if (hip) return hip
    }
  }

  deleteInvalidBones(bone: Bone<Object3DEventMap>) {
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

  boneMapping(hips: Bone<Object3DEventMap>, map: Map<number, Bone<Object3DEventMap>>) {
    hips = this.deleteInvalidBones(hips)

    const skeleton = new SkeletonHelper(hips)
    const bones = skeleton.bones
    console.log(bones)

    const [lHip, spine, rHip] = <Bone<Object3DEventMap>[]>hips.children
      .filter(({ name }) => !name.toLowerCase().includes('tail')) // 部分模型有尾巴骨骼
      .sort((a, b) => a.position.x - b.position.x)
    // 左大腿
    lHip.userData.tag = 'left hip'
    map.set(mpHolistic.POSE_LANDMARKS.LEFT_HIP, lHip)
    // 左膝盖
    const leftKnee = lHip.children[0] as Bone<Object3DEventMap>
    leftKnee.userData.tag = 'left knee'
    map.set(mpHolistic.POSE_LANDMARKS_LEFT.LEFT_KNEE, leftKnee)
    // 左脚踝
    const leftAnkle = leftKnee.children[0] as Bone<Object3DEventMap>
    leftAnkle.userData.tag = 'left ankle'
    map.set(mpHolistic.POSE_LANDMARKS_LEFT.LEFT_ANKLE, leftAnkle)
    // 脊椎
    spine.userData.tag = 'spine'
    const spine1 = spine.children[0]
    spine1.userData.tag = 'spine1'
    const spine2 = spine1.children[0]
    spine2.userData.tag = 'spine2'
    const spine2Children = spine2.children.sort((a, b) => a.position.x - b.position.x)
    const l = spine2Children[0]
    // const neck = spine2Children[spine2Children.length >> 1]
    const r = spine2Children[spine2Children.length - 1]
    // 左肩
    const leftShoulder = l.children[0] as Bone<Object3DEventMap>
    leftShoulder.userData.tag = 'left shoulder'
    map.set(mpHolistic.POSE_LANDMARKS.LEFT_SHOULDER, leftShoulder)
    // 左手肘
    const leftElbow = leftShoulder.children[0] as Bone<Object3DEventMap>
    leftElbow.userData.tag = 'left elbow'
    map.set(mpHolistic.POSE_LANDMARKS_LEFT.LEFT_ELBOW, leftElbow)
    // 左手腕
    const leftWrist = leftElbow.children[0] as Bone<Object3DEventMap>
    leftWrist.userData.tag = 'left wrist'
    map.set(mpHolistic.POSE_LANDMARKS_LEFT.LEFT_WRIST, leftWrist)
    // 颈部
    // neck.userData.tag = 'neck'
    // neck.children[0].userData.tag = 'head'
    // 右肩
    const rightShoulder = r.children[0] as Bone<Object3DEventMap>
    rightShoulder.userData.tag = 'right shoulder'
    map.set(mpHolistic.POSE_LANDMARKS.RIGHT_SHOULDER, rightShoulder)
    // 右手肘
    const rightElbow = rightShoulder.children[0] as Bone<Object3DEventMap>
    rightElbow.userData.tag = 'right elbow'
    map.set(mpHolistic.POSE_LANDMARKS_RIGHT.RIGHT_ELBOW, rightElbow)
    // 右手腕
    const rightWrist = rightElbow.children[0] as Bone<Object3DEventMap>
    rightWrist.userData.tag = 'right wrist'
    map.set(mpHolistic.POSE_LANDMARKS_RIGHT.RIGHT_WRIST, rightWrist)
    // 右大腿
    rHip.userData.tag = 'right hip'
    map.set(mpHolistic.POSE_LANDMARKS.RIGHT_HIP, rHip)
    // 右膝盖
    const rightKnee = rHip.children[0] as Bone<Object3DEventMap>
    rightKnee.userData.tag = 'right knee'
    map.set(mpHolistic.POSE_LANDMARKS_RIGHT.RIGHT_KNEE, rightKnee)
    // 右脚踝
    const rightAnkle = rightKnee.children[0] as Bone<Object3DEventMap>
    rightAnkle.userData.tag = 'right ankle'
    map.set(mpHolistic.POSE_LANDMARKS_RIGHT.RIGHT_ANKLE, rightAnkle)
  }
}
