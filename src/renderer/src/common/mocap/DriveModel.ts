import * as Kalidokit from 'kalidokit'
import { Euler, Group, Object3D, Object3DEventMap, Quaternion, Vector3 } from 'three'
import { VRMHumanBoneName, VRMExpressionPresetName, VRM } from '@pixiv/three-vrm'
import { FBXAxis } from '@renderer/common/config/modelConfig'

export type SetDrivingModelFn = (vrmModel: VRM | Group<Object3DEventMap>) => void

export class DriveModel {
  currentModel: VRM | Group<Object3DEventMap> | null = null
  #oldLookTarget = new Euler()

  setModel(vrmModel: VRM | Group<Object3DEventMap>) {
    this.currentModel = vrmModel
    const initialPose = {
      LeftUpperArm: new Euler(0, 0, 1.25),
      LeftLowerArm: new Euler(0, 0, 0.1),
      LeftHand: new Euler(0, 0, 0.1),
      RightUpperArm: new Euler(0, 0, -1.25),
      RightLowerArm: new Euler(0, 0, -0.1),
      RightHand: new Euler(0, 0, -0.1)
    }
    this.#transformAxis(initialPose, vrmModel instanceof VRM)

    const start = performance.now()
    const init = (t) => {
      for (const key in initialPose) {
        this.#rigRotation(VRMHumanBoneName[key], initialPose[key])
      }

      if (t - start < 5000) requestAnimationFrame(init)
    }
    requestAnimationFrame(init)
  }

  #getAngle(axis, idx, rotation) {
    return axis[idx].length > 1 ? -rotation[axis[idx][1]] : rotation[axis[idx][0]]
  }

  #transformAxis(riggedPose, isVRM = false) {
    if (!this.currentModel || isVRM) return
    // const Axis = (<Group<Object3DEventMap>>this.currentModel).userData.type === 'fbx' ? FBXAxis : undefined
    for (const key in riggedPose) {
      let rotation = riggedPose[key]
      if (key === 'Hips') rotation = riggedPose.Hips.rotation
      if (!rotation) continue
      const { x, y, z } = rotation
      const tempRotation = { x, y, z }
      const axis = FBXAxis[key]
      rotation.x = this.#getAngle(axis, 0, tempRotation)
      rotation.y = this.#getAngle(axis, 1, tempRotation)
      rotation.z = this.#getAngle(axis, 2, tempRotation)
    }
  }

  /**
   * 骨骼旋转控制函數
   * @param name 骨骼名称
   * @param rotation 旋转角度
   * @param dampener 阻尼系数
   * @param lerpAmount 插值系数（用于控制旋转的平滑度）
   */
  #rigRotation(
    name: VRMHumanBoneName,
    rotation = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) {
    if (!this.currentModel) return
    let Part: Object3D<Object3DEventMap> | null
    if (this.currentModel instanceof VRM) {
      Part = this.currentModel.humanoid.getNormalizedBoneNode(name)
    } else {
      Part = this.currentModel.userData.bonesMap.get(name) ?? null
    }
    if (!Part) return

    const euler = new Euler(rotation.x * dampener, rotation.y * dampener, rotation.z * dampener)
    const quaternion = new Quaternion().setFromEuler(euler)
    Part.quaternion.slerp(quaternion, lerpAmount) // interpolate
  }

  /**
   * 骨骼位置控制函数
   * @param name 骨骼名称
   * @param position 骨骼新位置
   * @param dampener 阻尼系数
   * @param lerpAmount 插值系数（用于控制位置的平滑度）
   */
  rigPosition(
    name: VRMHumanBoneName,
    position = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) {
    if (!this.currentModel) return
    let Part: Object3D<Object3DEventMap> | null
    if (this.currentModel instanceof VRM) {
      Part = this.currentModel.humanoid.getNormalizedBoneNode(name)
    } else {
      Part = this.currentModel.userData.bonesMap.get(name) ?? null
    }
    if (!Part) return

    const vector = new Vector3(position.x * dampener, position.y * dampener, position.z * dampener)
    Part.position.lerp(vector, lerpAmount) // interpolate
  }

  /**
   * 面部表情控制函数
   * @param riggedFace 带有面部信息的对象
   */
  #rigFace(riggedFace: Kalidokit.TFace) {
    if (!(this.currentModel instanceof VRM)) return

    this.#rigRotation(VRMHumanBoneName.Neck, riggedFace.head, 0.7)

    const clamp = Kalidokit.Utils.clamp
    const lerp = Kalidokit.Vector.lerp

    // Blendshapes and Preset Name Schema
    const Blendshape = this.currentModel.expressionManager
    const PresetName = VRMExpressionPresetName

    if (!Blendshape) return

    // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
    // for VRM, 1 is closed, 0 is open.
    riggedFace.eye.l = lerp(
      clamp(1 - riggedFace.eye.l, 0, 1),
      Blendshape.getValue(PresetName.Blink)!,
      0.5
    )
    riggedFace.eye.r = lerp(
      clamp(1 - riggedFace.eye.r, 0, 1),
      Blendshape.getValue(PresetName.Blink)!,
      0.5
    )
    riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y)
    Blendshape.setValue(PresetName.Blink, riggedFace.eye.l)

    // Interpolate and set mouth blendshapes
    Blendshape.setValue(
      PresetName.Ih,
      lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.Ih)!, 0.5)
    )
    Blendshape.setValue(
      PresetName.Aa,
      lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.Aa)!, 0.5)
    )
    Blendshape.setValue(
      PresetName.Ee,
      lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.Ee)!, 0.5)
    )
    Blendshape.setValue(
      PresetName.Oh,
      lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.Oh)!, 0.5)
    )
    Blendshape.setValue(
      PresetName.Ou,
      lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.Ou)!, 0.5)
    )

    //PUPILS
    //interpolate pupil and keep a copy of the value
    const lookTarget = new Euler(
      lerp(this.#oldLookTarget.x, riggedFace.pupil.y, 0.4),
      lerp(this.#oldLookTarget.y, riggedFace.pupil.x, 0.4),
      0,
      'XYZ'
    )
    this.#oldLookTarget.copy(lookTarget)
    this.currentModel.lookAt?.applier.applyYawPitch(lookTarget.y, lookTarget.x)
  }

  /* VRM Character Animator */
  animateVRM(results) {
    if (!this.currentModel) return

    // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
    let riggedPose: Kalidokit.TPose,
      riggedLeftHand: Kalidokit.THand<'Left'>,
      riggedRightHand: Kalidokit.THand<'Right'>,
      riggedFace: Kalidokit.TFace

    const faceLandmarks = results.faceLandmarks
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.za
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks
    const rightHandLandmarks = results.leftHandLandmarks

    // Animate Face
    if (faceLandmarks) {
      riggedFace = Kalidokit.Face.solve(faceLandmarks, {
        runtime: 'mediapipe'
      })!
      this.#rigFace(riggedFace)
    }

    // Animate Pose
    if (pose2DLandmarks && pose3DLandmarks) {
      riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
        runtime: 'mediapipe'
      })!

      // if (this.currentModel instanceof VRM) {
      //   this.rigPosition(
      //     VRMHumanBoneName.Hips,
      //     {
      //       x: -riggedPose.Hips.position.x, // Reverse direction
      //       y: riggedPose.Hips.position.y + 1, // Add a bit of height
      //       z: -riggedPose.Hips.position.z // Reverse direction
      //     },
      //     1,
      //     0.07
      //   )
      // } else {
      //   const Axis = this.currentModel.userData.type === 'fbx' ? FBXAxis : undefined
      //   for (const key in Axis) {
      //     let rotation = riggedPose[key]
      //     if (key === 'Hips') rotation = riggedPose.Hips.rotation
      //     if (!rotation) continue
      //     const { x, y, z } = rotation
      //     const tempRotation = { x, y, z }
      //     const axis = FBXAxis[key]
      //     rotation.x = this.#getAngle(axis, 0, tempRotation)
      //     rotation.y = this.#getAngle(axis, 1, tempRotation)
      //     rotation.z = this.#getAngle(axis, 2, tempRotation)
      //   }
      // }

      this.#transformAxis(riggedPose, this.currentModel instanceof VRM)

      this.#rigRotation(VRMHumanBoneName.Hips, riggedPose.Hips.rotation, 0.7)

      this.#rigRotation(VRMHumanBoneName.Chest, riggedPose.Spine, 0.25)
      this.#rigRotation(VRMHumanBoneName.Spine, riggedPose.Spine, 0.45)

      this.#rigRotation(VRMHumanBoneName.RightUpperArm, riggedPose.RightUpperArm)
      this.#rigRotation(VRMHumanBoneName.RightLowerArm, riggedPose.RightLowerArm)
      this.#rigRotation(VRMHumanBoneName.LeftUpperArm, riggedPose.LeftUpperArm)
      this.#rigRotation(VRMHumanBoneName.LeftLowerArm, riggedPose.LeftLowerArm)

      this.#rigRotation(VRMHumanBoneName.LeftUpperLeg, riggedPose.LeftUpperLeg)
      this.#rigRotation(VRMHumanBoneName.LeftLowerLeg, riggedPose.LeftLowerLeg)
      this.#rigRotation(VRMHumanBoneName.RightUpperLeg, riggedPose.RightUpperLeg)
      this.#rigRotation(VRMHumanBoneName.RightLowerLeg, riggedPose.RightLowerLeg)

      // Animate Hands
      if (leftHandLandmarks) {
        riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, 'Left')!
        this.#rigRotation(VRMHumanBoneName.LeftHand, {
          // Combine pose rotation Z and hand rotation X Y
          z: riggedPose.LeftHand.z,
          y: riggedLeftHand.LeftWrist.y,
          x: riggedLeftHand.LeftWrist.x
        })
        this.#rigRotation(VRMHumanBoneName.LeftRingProximal, riggedLeftHand.LeftRingProximal)
        this.#rigRotation(
          VRMHumanBoneName.LeftRingIntermediate,
          riggedLeftHand.LeftRingIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.LeftRingDistal, riggedLeftHand.LeftRingDistal)
        this.#rigRotation(VRMHumanBoneName.LeftIndexProximal, riggedLeftHand.LeftIndexProximal)
        this.#rigRotation(
          VRMHumanBoneName.LeftIndexIntermediate,
          riggedLeftHand.LeftIndexIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.LeftIndexDistal, riggedLeftHand.LeftIndexDistal)
        this.#rigRotation(VRMHumanBoneName.LeftMiddleProximal, riggedLeftHand.LeftMiddleProximal)
        this.#rigRotation(
          VRMHumanBoneName.LeftMiddleIntermediate,
          riggedLeftHand.LeftMiddleIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.LeftMiddleDistal, riggedLeftHand.LeftMiddleDistal)
        this.#rigRotation(VRMHumanBoneName.LeftThumbProximal, riggedLeftHand.LeftThumbProximal)
        this.#rigRotation(
          VRMHumanBoneName.LeftThumbMetacarpal,
          riggedLeftHand.LeftThumbIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.LeftThumbDistal, riggedLeftHand.LeftThumbDistal)
        this.#rigRotation(VRMHumanBoneName.LeftLittleProximal, riggedLeftHand.LeftLittleProximal)
        this.#rigRotation(
          VRMHumanBoneName.LeftLittleIntermediate,
          riggedLeftHand.LeftLittleIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.LeftLittleDistal, riggedLeftHand.LeftLittleDistal)
      }
      if (rightHandLandmarks) {
        riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, 'Right')!
        this.#rigRotation(VRMHumanBoneName.RightHand, {
          // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
          z: riggedPose.RightHand.z,
          y: riggedRightHand.RightWrist.y,
          x: riggedRightHand.RightWrist.x
        })
        this.#rigRotation(VRMHumanBoneName.RightRingProximal, riggedRightHand.RightRingProximal)
        this.#rigRotation(
          VRMHumanBoneName.RightRingIntermediate,
          riggedRightHand.RightRingIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.RightRingDistal, riggedRightHand.RightRingDistal)
        this.#rigRotation(VRMHumanBoneName.RightIndexProximal, riggedRightHand.RightIndexProximal)
        this.#rigRotation(
          VRMHumanBoneName.RightIndexIntermediate,
          riggedRightHand.RightIndexIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.RightIndexDistal, riggedRightHand.RightIndexDistal)
        this.#rigRotation(VRMHumanBoneName.RightMiddleProximal, riggedRightHand.RightMiddleProximal)
        this.#rigRotation(
          VRMHumanBoneName.RightMiddleIntermediate,
          riggedRightHand.RightMiddleIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.RightMiddleDistal, riggedRightHand.RightMiddleDistal)
        this.#rigRotation(VRMHumanBoneName.RightThumbProximal, riggedRightHand.RightThumbProximal)
        this.#rigRotation(
          VRMHumanBoneName.RightThumbMetacarpal,
          riggedRightHand.RightThumbIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.RightThumbDistal, riggedRightHand.RightThumbDistal)
        this.#rigRotation(VRMHumanBoneName.RightLittleProximal, riggedRightHand.RightLittleProximal)
        this.#rigRotation(
          VRMHumanBoneName.RightLittleIntermediate,
          riggedRightHand.RightLittleIntermediate
        )
        this.#rigRotation(VRMHumanBoneName.RightLittleDistal, riggedRightHand.RightLittleDistal)
      }
    }
  }
}
