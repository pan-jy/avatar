import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'virtual:svg-icons-register'
import PrimeVue from 'primevue/config'
import Wind from '@renderer/assets/presets/wind'
import 'primevue/resources/themes/aura-dark-amber/theme.css' // theme

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  unstyled: true,
  pt: Wind
})
app.mount('#app')
