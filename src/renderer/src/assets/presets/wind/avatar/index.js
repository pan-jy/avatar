const colorList = [
  'text-red-400',
  'text-orange-500',
  'text-amber-400',
  'text-lime-400',
  'text-lime-600',
  'text-green-500',
  'text-emerald-400',
  'text-teal-400',
  'text-cyan-400',
  'text-sky-400',
  'text-blue-400',
  'text-indigo-400',
  'text-violet-400',
  'text-purple-400',
  'text-fuchsia-400',
  'text-pink-400',
  'text-rose-400'
]

export default {
  root: ({ props, parent }) => {
    const textColor = colorList[Math.floor(Math.random() * colorList.length)]
    return {
      class: [
        // Font
        // {
        //   'text-sm': props.size == 'normal',
        //   'text-lg': props.size == 'large',
        //   'text-xl': props.size == 'xlarge'
        // },

        // Alignments
        'inline-flex items-center justify-center',
        'shrink-0',
        'relative',

        // Sizes
        // {
        //   'h-8 w-8': props.size == 'normal',
        //   'w-12 h-12': props.size == 'large',
        //   'w-16 h-16': props.size == 'xlarge'
        // },
        { '-ml-4': parent.instance.$style?.name == 'avatargroup' },

        // Shapes
        {
          'rounded-lg': props.shape == 'square',
          'rounded-full': props.shape == 'circle'
        },
        { 'border-2': parent.instance.$style?.name == 'avatargroup' },

        // Colors
        'bg-surface-100 dark:bg-surface-700',
        { 'border-white dark:border-surface-800': parent.instance.$style?.name == 'avatargroup' },

        textColor
      ]
    }
  },
  image: ({ props }) => ({
    class: [
      'h-full w-full',
      {
        'rounded-lg': props.shape == 'square',
        'rounded-full': props.shape == 'circle'
      }
    ]
  })
}
