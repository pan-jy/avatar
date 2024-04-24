import { SendFunction } from './Stream'

export type VideoConfig = { mediaSource: 'video'; videoFile: File }

export class VideoStream {
  #videoElement: HTMLVideoElement
  #animationId = -1
  #send: SendFunction = async () => {}

  constructor(videoElement: HTMLVideoElement, send: SendFunction) {
    this.#videoElement = videoElement
    this.#send = send
  }

  async start({ videoFile }: VideoConfig): Promise<void> {
    const url = URL.createObjectURL(videoFile)
    this.#videoElement.src = url

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
    this.#videoElement.pause()
    this.#videoElement.src = ''
    this.#videoElement.onloadedmetadata = null
    return Promise.resolve()
  }
}
