export interface BackgroundImage {
  name: string
  cover?: string
  src?: string
  userUpload?: boolean
}
export type BackgroundImageList = BackgroundImage[][]

export async function getBackgroundList() {
  const list = await window.electron.ipcRenderer.invoke('read-resources-dir', '/background')
  const backgroundList: BackgroundImageList = []
  const idx2D = list.findIndex(({ name }) => name === '2d')
  const orders2D = ['morning', 'midday', 'night', 'transparent']
  backgroundList.push(
    list[idx2D].children
      .map(({ name, src }) => {
        if (name === 'transparent.png') return { name: 'transparent' }
        return {
          name: name.split('_')[0],
          src
        }
      })
      .sort((a, b) => orders2D.indexOf(a.name) - orders2D.indexOf(b.name))
  )

  backgroundList.push(
    list[1 - idx2D].children.map(({ name, children }) => {
      const coverIdx = children.findIndex(({ name }) => name === 'cover.jpg')
      return {
        name,
        cover: children[coverIdx].src,
        src: children[1 - coverIdx].src
      }
    })
  )
  return backgroundList
}

export const tabs = [
  {
    label: '2D',
    icon: 'bg-2D'
  },
  {
    label: '3D',
    icon: 'bg-3D'
  },
  {
    label: '颜色',
    icon: 'bg-palette'
  }
]
