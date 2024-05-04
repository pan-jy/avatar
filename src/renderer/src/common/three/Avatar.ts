import { Clock, Color, Mesh, MeshBasicMaterial, SphereGeometry, TextureLoader } from 'three'
import { Base, ModelFileType } from './Base'
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import io from 'socket.io-client'
import { ModelInfo, PresetModelList } from '../../components/sideBar/selectModel/modelConfig'
import { SetDrivingModelFn } from '../mocap/DriveModel'
import { backgroundImages } from '@renderer/components/sideBar/customBackground/backgroundConfig'

export enum BackgroundType {
  '2d',
  '3d',
  'color'
}

export type BackgroundConfig = { type: BackgroundType; value?: string }

export class Avatar extends Base {
  backgroundConfig: BackgroundConfig = {
    type: BackgroundType['2d'],
    value: backgroundImages[0][0].src
  }
  modelInfo: ModelInfo = PresetModelList[0]
  #setDrivingModel: SetDrivingModelFn

  constructor(container: HTMLElement, setDrivingModel: SetDrivingModelFn) {
    super(container)

    this.initBackground()

    this.initModel()
    this.#setDrivingModel = setDrivingModel

    // 设置控制器
    this.controls.maxDistance = 3
    this.controls.minDistance = 0.5
  }

  async initBackground() {
    const config = await window.electron.ipcRenderer.invoke('get-store', 'background')
    if (config) this.backgroundConfig = config
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
    if (modelInfo) this.modelInfo = modelInfo
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
