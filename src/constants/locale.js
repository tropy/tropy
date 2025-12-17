const LOCALE = {
  'cn': 'cn',
  'zh': 'cn',
  'de': 'de',
  'en': 'en',
  'es': 'es',
  'fi-FI': 'fi-FI',
  'fr': 'fr',
  'it': 'it',
  'ja': 'ja',
  'nl-NL': 'nl-NL',
  'pt': 'pt',
  'pt-BR': 'pt-BR',
  'ru': 'ru',
  'uk': 'uk'
}

export const supportedLanguages =
  Object.keys(LOCALE).sort().filter(lang => lang !== 'zh')

LOCALE.default = 'en'
export default LOCALE
