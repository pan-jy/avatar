import { Camera, CameraInterface } from '@mediapipe/camera_utils'
import { VideoStream } from './VideoStream'
import { CameraStream } from './CameraStream'
import type { InputMap } from '@mediapipe/holistic'

export type StreamType = 'camera' | 'video'

export class Stream implements CameraInterface {
  #videoElement: HTMLVideoElement
  #camera: Camera | null = null
  #video: VideoStream | null = null
  #stream: Camera | VideoStream | null = null
  #send: (inputs: InputMap) => Promise<void>
  static CAMERA_RATIO = 16 / 9

  constructor(videoElement: HTMLVideoElement, send: (inputs: InputMap) => Promise<void>) {
    this.#videoElement = videoElement
    this.#send = send
    this.setStream('camera')
  }

  #initCamera() {
    const width = 1080
    const height = width / Stream.CAMERA_RATIO
    this.#camera = new CameraStream(this.#videoElement, this.#send, { width, height })
  }

  #initVideo() {
    this.#video = new VideoStream(this.#videoElement, this.#send)
  }

  setStream(mediaSource: StreamType) {
    if (mediaSource === 'camera') {
      if (!this.#camera) this.#initCamera()
      this.#stream = this.#camera
    } else {
      if (!this.#video) this.#initVideo()
      this.#stream = this.#video
    }
  }

  start() {
    if (!this.#stream) return Promise.resolve()
    return this.#stream.start()
  }

  stop() {
    if (!this.#stream) return Promise.resolve()
    this.#stream.stop()
    return Promise.resolve()
  }
}
