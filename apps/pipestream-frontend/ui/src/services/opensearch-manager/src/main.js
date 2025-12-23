import { createApp } from 'vue'
import App from './App.vue'

// Vuetify styles
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

const vuetify = createVuetify({ components, directives })

createApp(App).use(vuetify).mount('#app')