import type { TPose } from 'kalidokit'

export const PresetModelList = [
  {
    name: 'Vanguard',
    path: '/models/fbx/Vanguard.fbx',
    cover: '/models/covers/Vanguard.png'
  },
  {
    name: 'Mousey',
    path: '/models/fbx/Mousey.fbx',
    cover: '/models/covers/Mousey.png'
  },
  {
    name: 'VAL',
    path: '/models/vrm/VAL.vrm',
    cover: '/models/covers/VAL.png'
  },
  {
    name: 'Ashtra',
    path: '/models/vrm/Ashtra.vrm',
    cover: '/models/covers/Ashtra.png'
  },
  {
    name: 'Hanako',
    path: '/models/vrm/Hanako.vrm',
    cover: '/models/covers/Hanako.png'
  },
  {
    name: 'Sendagaya',
    path: '/models/vrm/Sendagaya.vrm',
    cover: '/models/covers/Sendagaya.png'
  },
  {
    name: 'Amaris',
    path: '/models/vrm/Amaris.vrm',
    cover: '/models/covers/Amaris.png'
  },
  {
    name: 'Natsuki',
    path: '/models/vrm/Natsuki.vrm',
    cover: '/models/covers/Natsuki.png'
  },
  {
    name: 'Puer',
    path: '/models/vrm/PureGirl.vrm'
  },
  {
    name: 'Shirai',
    path: '/models/vrm/Shirai.vrm'
  },
  {
    name: 'Yukino',
    path: '/models/vrm/Uniform.vrm'
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
