import { createI18n } from 'vue-i18n'
import es from '../locales/es.json'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: {
    es: es
  }
})

export const availableLocales = [
  { key: 'es', label: 'Español' }
]

export default i18n
