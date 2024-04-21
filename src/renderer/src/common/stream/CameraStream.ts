import { CameraInterface } from '@mediapipe/camera_utils'
import type { InputMap } from '@mediapipe/holistic'

export class CameraStream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #options: { width: number; height: number }
  #stream: MediaStream | null = null
  #send: (inputs: InputMap) => Promise<void> = async () => {}

  constructor(
    videoElement: HTMLVideoElement,
    send: (inputs: InputMap) => Promise<void>,
    options: { width: number; height: number }
  ) {
    this.#videoElement = videoElement
    this.#send = send
    this.#options = options
  }

  async start() {
    // 打开摄像头
    this.#stream = await window.navigator.mediaDevices.getUserMedia({ video: this.#options })
    this.#videoElement.srcObject = this.#stream
    this.#videoElement.onloadedmetadata = () => {
      this.#videoElement.play()
      const sendFrame = async () => {
        await this.#send({ image: this.#videoElement })
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
