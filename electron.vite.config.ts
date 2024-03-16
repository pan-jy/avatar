import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
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
      AutoImport({
        imports: ['vue']
      }),
      Components({
        dirs: ['src/components', 'src/pages']
      }),
      createSvgIconsPlugin({
        iconDirs: [resolve(process.cwd(), 'src/renderer/src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]'
      })
    ],
    publicDir: resolve(__dirname, 'resources')
  }
})
