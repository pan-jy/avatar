import { Clock, Color, Mesh, MeshBasicMaterial, SphereGeometry, TextureLoader } from 'three'
import { Base, ModelFileType } from './Base'
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import io from 'socket.io-client'
import type { ModelInfo } from '../config/modelConfig'
import { SetDrivingModelFn } from '../mocap/DriveModel'
import { fabric } from 'fabric'
import { ChartLetItem, ChartLetList } from '../config/chartletConfig'
import { useToast } from 'primevue/usetoast'

export enum BackgroundType {
  '2d',
  '3d',
  'color'
}

export type BackgroundConfig = { type: BackgroundType; value?: string }
type Layer = 'model' | 'chartlet'

export class Avatar extends Base {
  backgroundConfig: BackgroundConfig | null = null
  modelInfo: ModelInfo | null = null
  chartletList: ChartLetList = []
  #chartletMap: Map<ChartLetItem, fabric.Object> = new Map()
  #fabricCanvas: fabric.Canvas
  #curLayer: Layer = 'model'
  #setDrivingModel: SetDrivingModelFn
  #toast = useToast()

  constructor(container: HTMLElement, setDrivingModel: SetDrivingModelFn) {
    const fabricCanvas = new fabric.Canvas('fabricCanvas', {
      containerClass: 'fabric-canvas-container'
    })

    const resizeFn = (width: number, height: number) => {
      fabricCanvas.setWidth(width)
      fabricCanvas.setHeight(height)
      fabricCanvas.renderAll()
    }
    super(container, resizeFn)

    this.#fabricCanvas = fabricCanvas

    this.initBackground()

    this.initModel()
    this.#setDrivingModel = setDrivingModel

    // 设置控制器
    this.controls.maxDistance = 3
    this.controls.minDistance = 0.5

    this.#switchLayer('model')

    this.watchKeyEvents()
  }

  watchKeyEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        this.#switchLayer()
      }
    })
  }

  #switchLayer(layer?: Layer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricContainer = (<any>this.#fabricCanvas).wrapperEl as HTMLDivElement
    if (!fabricContainer) return

    if (layer) {
      if (this.#curLayer === layer) return
      this.#curLayer = layer
      fabricContainer.style.pointerEvents = layer === 'model' ? 'none' : 'auto'
      const toastMsg = `当前图层为：${layer === 'model' ? '模型层' : '贴图层'}, 按 Shift 切换`
      this.#toast.add({
        severity: 'info',
        detail: toastMsg,
        life: 3000
      })
    } else {
      this.#switchLayer(this.#curLayer === 'model' ? 'chartlet' : 'model')
    }
  }

  renderChartlets(chartletList: ChartLetList) {
    this.#switchLayer('chartlet')
    for (const item of new Set([...chartletList, ...this.chartletList])) {
      if (chartletList.includes(item) && this.chartletList.includes(item)) continue
      else if (chartletList.includes(item)) this.#renderChartLetItem(item)
      else this.#deleteChartLetItem(item)
    }
    this.chartletList = chartletList
  }

  #renderChartLetItem(item: ChartLetItem) {
    const src = item.src
    if (!src) return
    fabric.Image.fromURL(src, (img) => {
      const imgScale = 100 / (img.width || 100)
      img.set({
        left: 300,
        top: 100,
        scaleX: imgScale,
        scaleY: imgScale
      })
      this.#chartletMap.set(item, img)
      this.#fabricCanvas.add(img)
    })
  }

  #deleteChartLetItem(item: ChartLetItem) {
    const obj = this.#chartletMap.get(item)
    obj && this.#fabricCanvas.remove(obj)
    this.#chartletMap.delete(item)
  }

  async initBackground() {
    const background = await window.electron.ipcRenderer.invoke('get-store', 'background')
    this.backgroundConfig = background as BackgroundConfig
    this.setBackground(this.backgroundConfig)
  }

  setBackground(config: BackgroundConfig) {
    window.electron.ipcRenderer.invoke('set-store', 'background', config)
    this.backgroundConfig = config
    const { type, value } = config

    // 移除原有背景
    this.scene.background = null
    const backgroundObj = this.scene.getObjectByName('background')
    backgroundObj && this.scene.remove(backgroundObj)

    if (type === BackgroundType.color || !value) {
      if (!value) this.renderer.setClearColor(new Color(0x000000), 0)
      else this.renderer.setClearColor(new Color(value))
    } else if (type === BackgroundType['2d']) {
      const textureLoader = new TextureLoader()
      const texture = textureLoader.load(value)
      this.scene.background = texture
    } else {
      const sphereGeometry = new SphereGeometry(15, 50, 50)
      // 翻转面的方向，使得贴图在球体的内部
      sphereGeometry.scale(-1, 1, 1)
      const sphereMaterial = new MeshBasicMaterial({ map: new TextureLoader().load(value) })
      const sphere = new Mesh(sphereGeometry, sphereMaterial)
      sphere.name = 'background'
      this.scene.add(sphere)
    }
  }

  async initModel() {
    const modelInfo = await window.electron.ipcRenderer.invoke('get-store', 'modelInfo')
    this.modelInfo = modelInfo as ModelInfo
    this.handleModelChange(this.modelInfo)
  }

  async handleModelChange(modelInfo: ModelInfo) {
    window.electron.ipcRenderer.invoke('set-store', 'modelInfo', modelInfo)
    this.modelInfo = modelInfo
    const drivingModel = await this.loadModel(modelInfo.path)
    // 设置相机位置
    let neck
    if (drivingModel instanceof VRM) {
      neck = drivingModel.humanoid.getNormalizedBoneNode('neck')
      this.camera.position.z = 1
    } else {
      neck = this.bonesMap.get('neck')
      this.camera.position.z = 2
    }
    const { y = 1.4 } = neck!.localToWorld(neck!.position.clone())
    this.camera.position.y = y
    this.controls.target.y = y
    this.#setDrivingModel(drivingModel)
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

  async forwardStream() {
    const port = await window.electron.ipcRenderer.invoke('forward-stream')

    const canvas = this.renderer.domElement
    const stream = canvas.captureStream()
    const videoTrack = stream.getVideoTracks()[0]
    // videoTrack.applyConstraints({
    //   width: 1280,
    //   height: 720
    // })

    const socket = io(`http://localhost:${port}`)

    socket.on('leave', () => {
      socket.close()
    })

    socket.on('join', async () => {
      const pc = new RTCPeerConnection()
      pc.addTrack(videoTrack, stream)

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('candidate', e.candidate)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit('offer', offer)

      socket.on('answer', async (answer) => {
        await pc.setRemoteDescription(answer)
      })

      socket.on('candidate', async (candidate) => {
        await pc.addIceCandidate(candidate)
      })
    })
  }
}
