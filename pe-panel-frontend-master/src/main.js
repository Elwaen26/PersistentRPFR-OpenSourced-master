import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import CoreuiVue from '@coreui/vue'
import CIcon from '@coreui/icons-vue'
import { iconsSet as icons } from '@/assets/icons'
import DocsExample from '@/components/DocsExample'
import Datepicker from '@vuepic/vue-datepicker'
import { Icon } from '@vicons/utils'
import '@vuepic/vue-datepicker/dist/main.css'
import Vue3EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import '@vueform/multiselect/themes/default.css'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(CoreuiVue)
app.provide('icons', icons)
app.component('CIcon', CIcon)
app.component('DocsExample', DocsExample)
app.component('Datepicker', Datepicker)
app.component('Icon', Icon)
app.component('EasyDataTable', Vue3EasyDataTable)
dayjs.extend(utc)
app.provide('dayJS', dayjs)

app.mount('#app')
