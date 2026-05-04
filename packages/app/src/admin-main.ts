import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './admin-style.css'
import AdminLayout from './gui/tools/admin/AdminLayout.vue'

const pinia = createPinia()

const app = createApp(AdminLayout)

app.use(pinia)

app.mount('#app')
