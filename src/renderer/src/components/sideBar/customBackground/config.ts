export interface BackgroundImage {
  name: string
  cover?: string
  src?: string
}

export const backgroungImages: BackgroundImage[][] = [
  [
    {
      name: 'morning',
      src: '/background/2d/morning_bg.jpg'
    },
    {
      name: 'midday',
      src: '/background/2d/midday_bg.jpg'
    },
    {
      name: 'night',
      src: '/background/2d/night_bg.jpg'
    },
    {
      name: 'transparent'
    }
  ],
  [
    {
      name: 'starrynight',
      cover: '/background/3d/starrynight_icon.jpg',
      src: '/background/3d/starrynight.jpg'
    },
    {
      name: 'loft',
      cover: '/background/3d/loft_icon.jpg',
      src: '/background/3d/loft.jpg'
    },
    {
      name: 'monumentvalley',
      cover: '/background/3d/monumentvalley_icon.jpg',
      src: '/background/3d/monumentvalley.jpg'
    },
    {
      name: 'mars',
      cover: '/background/3d/mars_icon.jpg',
      src: '/background/3d/mars.jpg'
    },
    {
      name: 'factory',
      cover: '/background/3d/factory_icon.jpg',
      src: '/background/3d/factory.jpg'
    }
  ]
]
