export interface BackgroundImage {
  name: string
  cover?: string
  src?: string
}

const resourcesPath = import.meta.glob('@resources/background/**/*.jpg', {
  eager: true,
  import: 'default'
}) as Record<string, string>
for (const key in resourcesPath) {
  const newKey = key.split('resources')[1]
  resourcesPath[newKey] = resourcesPath[key]
  delete resourcesPath[key]
}

export const backgroundImages: BackgroundImage[][] = [
  [
    {
      name: 'morning',
      src: resourcesPath['/background/2d/morning_bg.jpg']
    },
    {
      name: 'midday',
      src: resourcesPath['/background/2d/midday_bg.jpg']
    },
    {
      name: 'night',
      src: resourcesPath['/background/2d/night_bg.jpg']
    },
    {
      name: 'transparent'
    }
  ],
  [
    {
      name: 'starrynight',
      cover: resourcesPath['/background/3d/starrynight_icon.jpg'],
      src: resourcesPath['/background/3d/starrynight.jpg']
    },
    {
      name: 'loft',
      cover: resourcesPath['/background/3d/loft_icon.jpg'],
      src: resourcesPath['/background/3d/loft.jpg']
    },
    {
      name: 'monumentvalley',
      cover: resourcesPath['/background/3d/monumentvalley_icon.jpg'],
      src: resourcesPath['/background/3d/monumentvalley.jpg']
    },
    {
      name: 'mars',
      cover: resourcesPath['/background/3d/mars_icon.jpg'],
      src: resourcesPath['/background/3d/mars.jpg']
    },
    {
      name: 'factory',
      cover: resourcesPath['/background/3d/factory_icon.jpg'],
      src: resourcesPath['/background/3d/factory.jpg']
    }
  ]
]

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
