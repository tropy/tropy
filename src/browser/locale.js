import { app } from 'electron'
import { LOCALE } from '../constants/index.js'

export function getLocale(locale) {
  return LOCALE[locale || app.getLocale()] || LOCALE.default
}

export function getSystemLanguage() {
  console.log(app.getPreferredSystemLanguages())
  return (
    app.getPreferredSystemLanguages()?.[0] || 'en'
  )
}

export function isRightToLeft(lang = getSystemLanguage()) {
  return (new Intl.Locale(lang)).textInfo?.direction === 'rtl'
}

export const defaultLocale = LOCALE.default
