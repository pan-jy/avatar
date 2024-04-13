import { CameraInterface } from '@mediapipe/camera_utils'
import { Holistic } from '@renderer/common/holistic/Holistic'

export class CameraStream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #options: { width: number; height: number }
  #stream: MediaStream | null = null
  #holistic: Holistic

  constructor(
    videoElement: HTMLVideoElement,
    holistic: Holistic,
    options: { width: number; height: number }
  ) {
    this.#videoElement = videoElement
    this.#holistic = holistic
    this.#options = options
  }

  async start() {
    // 打开摄像头
    this.#stream = await window.navigator.mediaDevices.getUserMedia({ video: this.#options })
    this.#videoElement.srcObject = this.#stream
    this.#videoElement.onloadedmetadata = () => {
      this.#videoElement.play()
      const sendFrame = async () => {
        await this.#holistic.send({ image: this.#videoElement })
        this.#animationId = requestAnimationFrame(sendFrame)
      }
      this.#animationId = requestAnimationFrame(sendFrame)
    }
  }

  stop() {
    cancelAnimationFrame(this.#animationId)
    this.#stream?.getTracks().forEach((track) => track.stop())
    this.#videoElement.srcObject = null
    this.#videoElement.onloadedmetadata = null
    return Promise.resolve()
  }
}
