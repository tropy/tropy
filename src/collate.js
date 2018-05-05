'use strict'

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
    return (a, b, cmp = sort().compare) => {
      for (let key of keys) {
        let res = cmp(a[key], b[key])
        if (0 !== res) return res
      }
      return 0
    }
  },

  equals(a, b) {
    return 0 === search().compare(a, b)
  },

  startsWith(string, term) {
    return 0 === search().compare(string.slice(0, term.length), term)
  }
}
