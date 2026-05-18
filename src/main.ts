import { ViteSSG } from 'vite-ssg/single-page'
import './assets/index.css'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

export const createApp = ViteSSG(
  App,
  ({ app }) => {
    const i18n = createI18n({
      legacy: false,
      locale: 'zh',
      fallbackLocale: 'en',
      messages: {
        zh,
        en
      }
    })
    app.use(i18n)
  }
)
