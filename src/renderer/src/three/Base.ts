import {
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  Object3DEventMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class Base {
  scene: Scene
  controls: OrbitControls
  #camera: PerspectiveCamera
  #renderer: WebGLRenderer
  #container: HTMLElement
  static FAR = 30

  model: Group<Object3DEventMap> | null = null

  constructor(container: HTMLElement) {
    if (!container) throw new Error('container is required')

    this.#container = container
    // 创建相机
    this.#camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, Base.FAR)
    this.#camera.position.set(3, 1, 3)

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

  async #loadGLTFModel(path: string) {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(path)
    const model = gltf.scene
    // 朝向镜头
    model.rotation.y = Math.PI * 1.25

    model.traverse(function (child) {
      if ((<Mesh>child).isMesh) child.castShadow = true
    })
    // this.scene.add(model)
    return model
  }

  async #loadFBXModel(path: string) {
    const loader = new FBXLoader()
    const model = await loader.loadAsync(path)
    // fbc 格式的模型单位是 cm，需要缩小 100 倍
    model.scale.set(0.01, 0.01, 0.01)
    // 朝向镜头
    model.rotation.y = Math.PI / 4

    model.traverse(function (child) {
      if ((<Mesh>child).isMesh) child.castShadow = true
    })
    // this.scene.add(model)
    return model
  }

  async loadModel(path: string) {
    const extName = path.split('.').pop()
    let model: Group<Object3DEventMap>
    if (extName === 'fbx') {
      model = await this.#loadFBXModel(path)
    } else {
      model = await this.#loadGLTFModel(path)
    }
    this.scene.add(model)
    this.model = model

    console.log(model)
    return model
  }
}
