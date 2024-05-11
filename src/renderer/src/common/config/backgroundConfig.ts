export interface BackgroundImage {
  name: string
  cover?: string
  src?: string
  userUpload?: boolean
}

const BASE_URL = import.meta.env.BASE_URL

export const backgroundImages: BackgroundImage[][] = [
  [
    {
      name: 'morning',
      src: BASE_URL + 'background/2d/morning_bg.jpg'
    },
    {
      name: 'midday',
      src: BASE_URL + 'background/2d/midday_bg.jpg'
    },
    {
      name: 'night',
      src: BASE_URL + 'background/2d/night_bg.jpg'
    },
    {
      name: 'transparent'
    }
  ],
  [
    {
      name: 'starrynight',
      cover: BASE_URL + 'background/3d/starrynight_icon.jpg',
      src: BASE_URL + 'background/3d/starrynight.jpg'
    },
    {
      name: 'loft',
      cover: BASE_URL + 'background/3d/loft_icon.jpg',
      src: BASE_URL + 'background/3d/loft.jpg'
    },
    {
      name: 'monumentvalley',
      cover: BASE_URL + 'background/3d/monumentvalley_icon.jpg',
      src: BASE_URL + 'background/3d/monumentvalley.jpg'
    },
    {
      name: 'mars',
      cover: BASE_URL + 'background/3d/mars_icon.jpg',
      src: BASE_URL + 'background/3d/mars.jpg'
    },
    {
      name: 'factory',
      cover: BASE_URL + 'background/3d/factory_icon.jpg',
      src: BASE_URL + 'background/3d/factory.jpg'
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
