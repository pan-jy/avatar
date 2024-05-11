import type { TPose } from 'kalidokit'

export interface ModelInfo {
  path: string
  name: string
  userUpload?: boolean
  cover?: string
}

const BASE_URL = import.meta.env.BASE_URL

export type PresetModelList = Array<ModelInfo>

export const presetModelList: PresetModelList = [
  {
    name: 'Yukino',
    path: BASE_URL + 'models/vrm/Uniform.vrm'
  },
  {
    name: 'VAL',
    path: BASE_URL + 'models/vrm/VAL.vrm',
    cover: BASE_URL + 'models/covers/VAL.png'
  },
  {
    name: 'Ashtra',
    path: BASE_URL + 'models/vrm/Ashtra.vrm',
    cover: BASE_URL + 'models/covers/Ashtra.png'
  },
  {
    name: 'Hanako',
    path: BASE_URL + 'models/vrm/Hanako.vrm',
    cover: BASE_URL + 'models/covers/Hanako.png'
  },
  {
    name: 'Sendagaya',
    path: BASE_URL + 'models/vrm/Sendagaya.vrm',
    cover: BASE_URL + 'models/covers/Sendagaya.png'
  },
  {
    name: 'Amaris',
    path: BASE_URL + 'models/vrm/Amaris.vrm',
    cover: BASE_URL + 'models/covers/Amaris.png'
  },
  {
    name: 'Natsuki',
    path: BASE_URL + 'models/vrm/Natsuki.vrm',
    cover: BASE_URL + 'models/covers/Natsuki.png'
  },
  {
    name: 'Puer',
    path: BASE_URL + 'models/vrm/PureGirl.vrm'
  },
  {
    name: 'Shirai',
    path: BASE_URL + 'models/vrm/Shirai.vrm'
  },
  {
    name: 'Vanguard',
    path: BASE_URL + 'models/fbx/Vanguard.fbx',
    cover: BASE_URL + 'models/covers/Vanguard.png'
  },
  {
    name: 'Mousey',
    path: BASE_URL + 'models/fbx/Mousey.fbx',
    cover: BASE_URL + 'models/covers/Mousey.png'
  }
]

export const FBXAxis: Record<keyof TPose, Array<string>> = {
  Hips: ['-x', 'y', '-z'],
  Spine: ['-x', 'y', '-z'],
  RightUpperArm: ['-z', 'x', '-y'],
  RightLowerArm: ['-z', 'x', '-y'],
  RightHand: ['-z', 'x', '-y'],
  LeftUpperArm: ['z', '-x', '-y'],
  LeftLowerArm: ['z', '-x', '-y'],
  LeftHand: ['z', '-x', '-y'],
  RightUpperLeg: ['x', '-y', '-z'],
  RightLowerLeg: ['x', '-y', '-z'],
  LeftUpperLeg: ['x', '-y', '-z'],
  LeftLowerLeg: ['x', '-y', '-z']
}
