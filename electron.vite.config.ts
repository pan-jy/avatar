import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { normalizePath } from 'vite'
import { mediapipe } from 'vite-plugin-mediapipe'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: normalizePath(resolve(__dirname, 'src/main/forward/**/*.{html,js}')),
            dest: 'forward'
          }
        ]
      })
    ],
    publicDir: resolve(__dirname, 'resources')
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
      }),
      mediapipe()
    ],
    publicDir: resolve(__dirname, 'resources')
  }
})
