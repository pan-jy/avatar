import { Clock, Color, TextureLoader } from 'three'
import { Base, ModelFileType } from './Base'
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import io from 'socket.io-client'

export enum BackgroundType {
  '2d',
  '3d',
  'color'
}

export type BackgroundConfig = { type: BackgroundType; value?: string }

export class Avatar extends Base {
  backgroundConfig: BackgroundConfig | null = null

  constructor(container: HTMLElement) {
    super(container)

    this.initBackground()

    // 设置控制器
    this.controls.maxDistance = 10
    this.controls.minDistance = 0.5
    this.controls.target.set(0, 1, 0)
  }

  async initBackground() {
    let config = await window.electron.ipcRenderer.invoke('get-store', 'background')
    if (!config) config = { type: BackgroundType['2d'], value: '/background/morning_bg.jpg' }
    this.setBackground(config)
    this.backgroundConfig = config
  }

  async getBackgroundConfig(): Promise<BackgroundConfig> {
    if (!this.backgroundConfig) await this.initBackground()
    return this.backgroundConfig!
  }

  setBackground({ type, value }: BackgroundConfig) {
    if (type === BackgroundType.color) {
      this.renderer.setClearColor(new Color(value))
    } else if (type === BackgroundType['2d']) {
      if (!value) this.renderer.setClearColor(new Color(0x000000), 0)
      else {
        const textureLoader = new TextureLoader()
        const texture = textureLoader.load(value)
        this.scene.background = texture
      }
    }
    window.electron.ipcRenderer.invoke('set-store', 'background', { type, value })
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
