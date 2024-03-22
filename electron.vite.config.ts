import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      Components({
        dirs: ['src/components', 'src/pages'],
        resolvers: [
          PrimeVueResolver({
            prefix: 'Pr'
          })
        ]
      }),
      createSvgIconsPlugin({
        iconDirs: [resolve(process.cwd(), 'src/renderer/src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]'
      })
    ],
    publicDir: resolve(__dirname, 'resources')
  }
})
