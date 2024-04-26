export interface BackgroundImage {
  name: string
  src?: string
}

export const backgroungImages: Array<BackgroundImage> = [
  {
    name: 'morning',
    src: '/background/morning_bg.jpg'
  },
  {
    name: 'midday',
    src: '/background/midday_bg.jpg'
  },
  {
    name: 'night',
    src: '/background/night_bg.jpg'
  },
  {
    name: 'transparent'
  }
]
