import { SendFunction } from './Stream'

export type CameraConfig = { mediaSource: 'camera'; deviceId: string }

export class CameraStream {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #stream: MediaStream | null = null
  #send: SendFunction = async () => {}
  static CAMERA_RATIO = 16 / 9
  width = 1080
  height = this.width / CameraStream.CAMERA_RATIO

  constructor(videoElement: HTMLVideoElement, send: SendFunction) {
    this.#videoElement = videoElement
    this.#send = send
  }

  async start({ deviceId }: CameraConfig) {
    // 打开摄像头
    this.#stream = await window.navigator.mediaDevices.getUserMedia({
      video: {
        deviceId,
        width: this.width,
        height: this.height
      }
    })
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
