import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import resources from './i18n/i18n.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    supportedLngs: ['fi', 'sv', 'en'],
    fallbackLng: 'fi',
    detection: {
      order: ['querystring', 'navigator'],
      lookupQuerystring: 'lang',
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    returnNull: false,
  })

export default i18n
