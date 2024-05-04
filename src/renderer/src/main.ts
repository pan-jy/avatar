import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'virtual:svg-icons-register'
import PrimeVue from 'primevue/config'
import Wind from '@renderer/assets/presets/wind'
import 'primeicons/primeicons.css'
import Tooltip from 'primevue/tooltip'
import { Config, configKey } from './common/config/Config'

const app = createApp(App)
app.directive('tooltip', Tooltip)

const config = new Config()
app.provide(configKey, config)

app.use(router)
app.use(PrimeVue, {
  unstyled: true,
  pt: Wind
})
app.mount('#app')
