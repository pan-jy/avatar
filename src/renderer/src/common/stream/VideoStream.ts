import { CameraInterface } from '@mediapipe/camera_utils'
import { Holistic } from '@renderer/common/holistic/Holistic'

export class VideoStream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #holistic: Holistic

  constructor(videoElement: HTMLVideoElement, holistic: Holistic) {
    this.#videoElement = videoElement
    this.#holistic = holistic
  }

  start() {
    this.#videoElement.play()
    const sendFrame = async () => {
      await this.#holistic.send({ image: this.#videoElement })
      this.#animationId = requestAnimationFrame(sendFrame)
    }
    this.#animationId = requestAnimationFrame(sendFrame)
    return Promise.resolve()
  }

  stop() {
    this.#videoElement.pause()
    cancelAnimationFrame(this.#animationId)
    return Promise.resolve()
  }
}
