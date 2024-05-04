import type { TPose } from 'kalidokit'

export interface ModelInfo {
  path: string
  name: string
  cover?: string
}

export type PresetModelList = Array<ModelInfo>

const resourcesPath = import.meta.glob('@resources/models/**/*.{vrm,fbx,png}', {
  eager: true,
  import: 'default'
}) as Record<string, string>
for (const key in resourcesPath) {
  const newKey = key.split('resources')[1]
  resourcesPath[newKey] = resourcesPath[key]
  delete resourcesPath[key]
}

export const presetModelList: PresetModelList = [
  {
    name: 'Yukino',
    path: resourcesPath['/models/vrm/Uniform.vrm']
  },
  {
    name: 'VAL',
    path: resourcesPath['/models/vrm/VAL.vrm'],
    cover: resourcesPath['/models/covers/VAL.png']
  },
  {
    name: 'Ashtra',
    path: resourcesPath['/models/vrm/Ashtra.vrm'],
    cover: resourcesPath['/models/covers/Ashtra.png']
  },
  {
    name: 'Hanako',
    path: resourcesPath['/models/vrm/Hanako.vrm'],
    cover: resourcesPath['/models/covers/Hanako.png']
  },
  {
    name: 'Sendagaya',
    path: resourcesPath['/models/vrm/Sendagaya.vrm'],
    cover: resourcesPath['/models/covers/Sendagaya.png']
  },
  {
    name: 'Amaris',
    path: resourcesPath['/models/vrm/Amaris.vrm'],
    cover: resourcesPath['/models/covers/Amaris.png']
  },
  {
    name: 'Natsuki',
    path: resourcesPath['/models/vrm/Natsuki.vrm'],
    cover: resourcesPath['/models/covers/Natsuki.png']
  },
  {
    name: 'Puer',
    path: resourcesPath['/models/vrm/PureGirl.vrm']
  },
  {
    name: 'Shirai',
    path: resourcesPath['/models/vrm/Shirai.vrm']
  },
  {
    name: 'Vanguard',
    path: resourcesPath['/models/fbx/Vanguard.fbx'],
    cover: resourcesPath['/models/covers/Vanguard.png']
  },
  {
    name: 'Mousey',
    path: resourcesPath['/models/fbx/Mousey.fbx'],
    cover: resourcesPath['/models/covers/Mousey.png']
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
