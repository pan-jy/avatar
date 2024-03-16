import {
  AxesHelper,
  Color,
  DirectionalLight,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class ModelPreview {
  #camera: PerspectiveCamera
  #scene: Scene
  #renderer: WebGLRenderer
  #container: HTMLElement
  #controls: OrbitControls
  static FAR = 30

  model: Group<Object3DEventMap> | null = null

  constructor(container: HTMLElement) {
    if (!container) throw new Error('container is required')

    this.#container = container
    // 创建相机
    this.#camera = new PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      ModelPreview.FAR
    )
    this.#camera.position.set(3, 1, 3)

    // 创建场景
    this.#scene = new Scene()
    this.#scene.background = new Color('skyblue')
    this.#scene.fog = new Fog(this.#scene.background, ModelPreview.FAR / 2, ModelPreview.FAR) // 添加雾化效果

    // 创建 WebGLRenderer
    this.#renderer = new WebGLRenderer({ antialias: true }) // 抗锯齿
    this.#renderer.shadowMap.enabled = true

    // 初始以及调整窗口大小时，调整并重新渲染
    window.addEventListener('resize', this.setSize.bind(this))
    this.setSize()

    // 创建控制器
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.maxPolarAngle = Math.PI / 2
    this.#controls.minPolarAngle = Math.PI / 9
    this.#controls.enableDamping = true
    this.#controls.maxDistance = 10
    this.#controls.minDistance = 0.5
    this.#controls.target.set(0, 1, 0)

    // 添加灯光
    this.#createLights()

    // 添加地面
    this.#createGound()

    // 将渲染器的 canvas 添加到容器中
    container.append(this.#renderer.domElement)

    // 添加坐标轴、网格
    this.#scene.add(
      new AxesHelper(ModelPreview.FAR),
      new GridHelper(ModelPreview.FAR, ModelPreview.FAR)
    )
  }

  setSize() {
    // 更新相机的宽高比
    this.#camera.aspect = this.#container.clientWidth / this.#container.clientHeight
    // 更新相机的投影矩阵
    this.#camera.updateProjectionMatrix()
    // 更新渲染器的大小
    this.#renderer.setSize(this.#container.clientWidth, this.#container.clientHeight)
    // 更新渲染器的像素比
    this.#renderer.setPixelRatio(window.devicePixelRatio)
  }

  start() {
    this.#renderer.setAnimationLoop(() => {
      this.#controls.update()
      this.#renderer.render(this.#scene, this.#camera)
    })
  }

  #createLights() {
    const dirLight = new DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 5, 5)
    dirLight.castShadow = true

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0) // 上方

    this.#scene.add(dirLight, hemiLight)
  }

  #createGound() {
    const ground = new Mesh(
      new PlaneGeometry(ModelPreview.FAR, ModelPreview.FAR),
      new MeshPhongMaterial({ color: 0x8d8d8d, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    this.#scene.add(ground)
  }

  async loadGLTFModel(path: string) {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(path)
    const model = gltf.scene
    // 朝向镜头
    model.rotation.y = Math.PI * 1.25

    model.traverse(function (child) {
      if ((<Mesh>child).isMesh) child.castShadow = true
    })
    // this.#scene.add(model)
    return model
  }

  async loadFBXModel(path: string) {
    const loader = new FBXLoader()
    const model = await loader.loadAsync(path)
    // fbc 格式的模型单位是 cm，需要缩小 100 倍
    model.scale.set(0.01, 0.01, 0.01)
    // 朝向镜头
    model.rotation.y = Math.PI / 4

    model.traverse(function (child) {
      if ((<Mesh>child).isMesh) child.castShadow = true
    })
    // this.#scene.add(model)
    return model
  }

  async loadModel(path: string) {
    const extName = path.split('.').pop()
    let model: Group<Object3DEventMap>
    if (extName === 'fbx') {
      model = await this.loadFBXModel(path)
    } else {
      model = await this.loadGLTFModel(path)
    }
    this.#scene.add(model)
    this.model = model

    console.log(model)
    return model
  }
}
