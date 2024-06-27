import { app } from 'electron'
import { LOCALE } from '../constants/index.js'

export function getLocale(locale) {
  return LOCALE[locale || app.getLocale()] || LOCALE.default
}

export function getSystemLanguage() {
  return (
    app.getPreferredSystemLanguages()?.[0] || defaultLocale
  )
}

export function isRightToLeft(lang = getSystemLanguage()) {
  try {
    return (new Intl.Locale(lang)).textInfo?.direction === 'rtl'
  } catch {
    return false
  }
}

export const defaultLocale = LOCALE.default
