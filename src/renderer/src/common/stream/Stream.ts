import { VideoConfig, VideoStream } from './VideoStream'
import { CameraConfig, CameraStream } from './CameraStream'
import type { InputMap } from '@mediapipe/holistic'

export type StreamType = 'camera' | 'video'
export type StreamConfig = CameraConfig | VideoConfig
export type SendFunction = (inputs: InputMap) => Promise<void>

export class Stream {
  #videoElement: HTMLVideoElement
  #camera: CameraStream | null = null
  #video: VideoStream | null = null
  #stream: CameraStream | VideoStream | null = null
  #send: SendFunction

  constructor(videoElement: HTMLVideoElement, send: SendFunction) {
    this.#videoElement = videoElement
    this.#send = send
  }

  start(config: StreamConfig) {
    const { mediaSource } = config
    if (mediaSource === 'camera') {
      if (!this.#camera) this.#camera = new CameraStream(this.#videoElement, this.#send)
      this.#stream = this.#camera
      return this.#camera.start(config)
    } else {
      if (!this.#video) this.#video = new VideoStream(this.#videoElement, this.#send)
      this.#stream = this.#video
      return this.#video.start(config)
    }
  }

  stop() {
    if (!this.#stream) return Promise.reject('Stream not set')
    return this.#stream.stop()
  }
}
