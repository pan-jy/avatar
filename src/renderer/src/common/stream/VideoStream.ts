import { CameraInterface } from '@mediapipe/camera_utils'
import type { InputMap } from '@mediapipe/holistic'

export class VideoStream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #send: (inputs: InputMap) => Promise<void> = async () => {}

  constructor(videoElement: HTMLVideoElement, send: (inputs: InputMap) => Promise<void>) {
    this.#videoElement = videoElement
    this.#send = send
  }

  start() {
    this.#videoElement.play()
    const sendFrame = async () => {
      await this.#send({ image: this.#videoElement })
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
