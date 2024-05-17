import type { TPose } from 'kalidokit'

export interface ModelInfo {
  path: string
  name: string
  userUpload?: boolean
  cover?: string
}

export type ModelList = Array<ModelInfo>

export async function getModelList() {
  const list = await window.electron.ipcRenderer.invoke('read-resources-dir', '/models')
  const modelList = list
    .map(({ children }) => children)
    .flat()
    .map(({ name, children }) => {
      const coverIdx = children.findIndex(
        ({ name }) => name.endsWith('.png') || name.endsWith('.jpg')
      )
      return {
        name,
        path: children[1 - coverIdx]?.src,
        cover: children[coverIdx]?.src
      }
    })
    .reverse() as ModelList
  return modelList
}

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
