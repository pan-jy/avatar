import {
  AxesHelper,
  Color,
  DirectionalLight,
  Fog,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SkeletonHelper,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class Model {
  #camera
  #scene
  #renderer
  #container
  #controls
  static FAR = 50

  constructor(container) {
    this.#container = container
    // 创建相机
    this.#camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, Model.FAR)
    this.#camera.position.set(3, 3, 3)

    // 创建场景
    this.#scene = new Scene()
    this.#scene.background = new Color('skyblue')
    this.#scene.fog = new Fog(this.#scene.background, 5, 30) // 添加雾化效果

    // 创建 WebGLRenderer
    this.#renderer = new WebGLRenderer({ antialias: true }) // 抗锯齿
    this.#renderer.shadowMap.enabled = true

    // 初始以及调整窗口大小时，调整并重新渲染
    window.addEventListener('resize', this.setSize.bind(this))
    this.setSize()

    // 创建控制器
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.addEventListener('change', () => this.render())
    this.#controls.maxPolarAngle = Math.PI / 2.2
    this.#controls.minPolarAngle = Math.PI / 6
    this.#controls.enableDamping = true
    this.#controls.maxDistance = 10
    this.#controls.minDistance = 0.5

    // 添加灯光
    this.#createLights()

    // 添加地面
    this.#createGound()

    // 加载模型
    this.loadGLTFModel()
    // this.loadFBXModel()

    // 将渲染器的 canvas 添加到容器中
    container.append(this.#renderer.domElement)

    // 添加坐标轴、网格
    this.#scene.add(new AxesHelper(Model.FAR), new GridHelper(Model.FAR, Model.FAR))
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
    // 重新渲染
    this.render()
  }

  render() {
    this.#renderer.render(this.#scene, this.#camera)
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
      new PlaneGeometry(Model.FAR, Model.FAR),
      new MeshPhongMaterial({ color: 0x8d8d8d, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    this.#scene.add(ground)
  }

  loadGLTFModel() {
    const loader = new GLTFLoader()
    loader.load('/model/gltf/Soldier.glb', (gltf) => {
      const model = gltf.scene
      // 朝向镜头
      model.rotateY(Math.PI * 1.25)

      // 深度优先遍历模型的所有子对象
      model.traverse(function (child) {
        if (child.isMesh) child.castShadow = true
      })

      const skeleton = new SkeletonHelper(model)
      skeleton.visible = true
      this.#scene.add(model, skeleton)
      this.render()
    })
  }

  loadFBXModel() {
    const loader = new FBXLoader()
    loader.load('/model/fbx/PeasantGirl.fbx', (model) => {
      model.scale.set(0.01, 0.01, 0.01)
      model.rotation.y = Math.PI / 4

      model.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      this.#scene.add(model)
      this.render()
    })
  }

  /* destroy() {
    this.#container.removeChild(this.#renderer.domElement)
    this.#renderer.dispose()
    window.removeEventListener('resize', this.setSize.bind(this))
  } */
}
