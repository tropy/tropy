'use strict'

const { any } = require('./common/util')

function sort(locale = ARGS.locale) {
  if (!(locale in sort)) {
    sort[locale] = new Intl.Collator(locale, {
      numeric: true
    })
  }

  return sort[locale]
}

function search(locale = ARGS.locale) {
  if (!(locale in search)) {
    search[locale] = new Intl.Collator(locale, {
      numeric: true,
      usage: 'search',
      sensitivity: 'base'
    })
  }

  return search[locale]
}


module.exports = {
  compare(a, b) {
    return sort().compare(a, b)
  },

  by(...keys) {
    return (a, b) => sort().compare(any(a, keys), any(b, keys))
  },

  equals(a, b) {
    return 0 === search().compare(a, b)
  },

  startsWith(string, term) {
    return 0 === search().compare(string.slice(0, term.length), term)
  }
}
