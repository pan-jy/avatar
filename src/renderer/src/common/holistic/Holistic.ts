import * as mpHolistic from '@mediapipe/holistic'
import * as drawingUtils from '@mediapipe/drawing_utils'

export class Holistic extends mpHolistic.Holistic {
  #sourceCanvas: HTMLCanvasElement
  #sourceCtx: CanvasRenderingContext2D
  #showLandmarks = true

  constructor(sourceCanvas: HTMLCanvasElement) {
    super({
      locateFile: (file) => {
        return import.meta.env.RENDERER_VITE_HOLISTIC_CDN + file
      }
    })
    this.#sourceCanvas = sourceCanvas
    this.#sourceCtx = sourceCanvas.getContext('2d')!
    this.onResults(() => {
      try {
        this.drawResults.bind(this)
      } catch (error) {
        this.reset()
      }
    })
  }

  clearLandMarks() {
    this.#sourceCtx.clearRect(0, 0, this.#sourceCanvas.width, this.#sourceCanvas.height)
  }

  // 移除 landmarks 中对应 index 的标记
  #removeElements(landmarks: mpHolistic.NormalizedLandmarkList, elements: number[]) {
    for (const element of elements) {
      delete landmarks[element]
    }
  }

  /**
   * 移除不需要绘制的标记
   * - 0-10: 面部标记
   * - 15-22: 双手标记
   * @param results 检测结果
   */
  #removeLandmarks(results: mpHolistic.Results) {
    if (results.poseLandmarks) {
      this.#removeElements(
        results.poseLandmarks,
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]
      )
    }
  }

  // 连接两个点
  #connect(
    ctx: CanvasRenderingContext2D,
    connectors: Array<[mpHolistic.NormalizedLandmark, mpHolistic.NormalizedLandmark]>
  ) {
    const { width, height } = ctx.canvas
    if (!width || !height) return
    for (const connector of connectors) {
      const from = connector[0]
      const to = connector[1]
      if (from && to) {
        // 如果两个点的 visibility 都小于 0.1，则不绘制
        if (from.visibility && to.visibility && (from.visibility < 0.1 || to.visibility < 0.1)) {
          continue
        }
        ctx.beginPath()
        ctx.moveTo(from.x * width, from.y * height)
        ctx.lineTo(to.x * width, to.y * height)
        ctx.stroke()
      }
    }
  }

  // 绘制骨架
  #drawLandmarks(sourceCtx: CanvasRenderingContext2D, results: mpHolistic.Results) {
    // 先连接手肘与手腕
    sourceCtx.lineWidth = 5
    if (results.poseLandmarks) {
      if (results.rightHandLandmarks) {
        sourceCtx.strokeStyle = 'white'
        this.#connect(sourceCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
            results.rightHandLandmarks[0]
          ]
        ])
      }
      if (results.leftHandLandmarks) {
        sourceCtx.strokeStyle = 'white'
        this.#connect(sourceCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
            results.leftHandLandmarks[0]
          ]
        ])
      }
    }

    // Pose...
    drawingUtils.drawConnectors(sourceCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, {
      color: 'white'
    })
    drawingUtils.drawLandmarks(
      sourceCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map((index) => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' }
    )
    drawingUtils.drawLandmarks(
      sourceCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map((index) => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' }
    )

    // Hands...
    drawingUtils.drawConnectors(
      sourceCtx,
      results.rightHandLandmarks,
      mpHolistic.HAND_CONNECTIONS,
      {
        color: 'white'
      }
    )
    drawingUtils.drawLandmarks(sourceCtx, results.rightHandLandmarks, {
      color: 'white',
      fillColor: 'rgb(0,217,231)',
      lineWidth: 2,
      radius: (data: drawingUtils.Data) => {
        return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
      }
    })
    drawingUtils.drawConnectors(sourceCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
      color: 'white'
    })
    drawingUtils.drawLandmarks(sourceCtx, results.leftHandLandmarks, {
      color: 'white',
      fillColor: 'rgb(255,138,0)',
      lineWidth: 2,
      radius: (data: drawingUtils.Data) => {
        return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1)
      }
    })

    // Face...
    drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_TESSELATION, {
      color: '#C0C0C070',
      lineWidth: 1
    })
    drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYE, {
      color: 'rgb(0,217,231)'
    })
    drawingUtils.drawConnectors(
      sourceCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_RIGHT_EYEBROW,
      {
        color: 'rgb(0,217,231)'
      }
    )
    drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYE, {
      color: 'rgb(255,138,0)'
    })
    drawingUtils.drawConnectors(
      sourceCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_LEFT_EYEBROW,
      {
        color: 'rgb(255,138,0)'
      }
    )
    drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_FACE_OVAL, {
      color: '#E0E0E0',
      lineWidth: 5
    })
    drawingUtils.drawConnectors(sourceCtx, results.faceLandmarks, mpHolistic.FACEMESH_LIPS, {
      color: '#E0E0E0',
      lineWidth: 5
    })
  }

  drawResults(results: mpHolistic.Results) {
    this.#removeLandmarks(results)

    // 更新帧率
    // fpsControl.tick()

    const { width, height } = this.#sourceCanvas

    this.#sourceCtx.save()
    this.#sourceCtx.clearRect(0, 0, width, height)

    // // 如果开启了分割，则绘制分割 mask
    // if (results.segmentationMask) {
    //   this.#sourceCtx.drawImage(results.segmentationMask, 0, 0, width, height)
    //   // Only overwrite existing pixels.
    //   if (activeEffect === 'mask' || activeEffect === 'both') {
    //     this.#sourceCtx.globalCompositeOperation = 'source-in'
    //     // This can be a color or a texture or whatever...
    //     this.#sourceCtx.fillStyle = '#00FF007F'
    //     this.#sourceCtx.fillRect(0, 0, width, height)
    //   } else {
    //     this.#sourceCtx.globalCompositeOperation = 'source-out'
    //     this.#sourceCtx.fillStyle = '#0000FF7F'
    //     this.#sourceCtx.fillRect(0, 0, width, height)
    //   }
    //   // Only overwrite missing pixels.
    //   this.#sourceCtx.globalCompositeOperation = 'destination-atop'
    //   this.#sourceCtx.drawImage(results.image, 0, 0, width, height)
    //   this.#sourceCtx.globalCompositeOperation = 'source-over'
    // } else {
    //   this.#sourceCtx.drawImage(results.image, 0, 0, width, height)
    // }

    if (this.#showLandmarks) this.#drawLandmarks(this.#sourceCtx, results)

    this.#sourceCtx.restore()
  }
}
