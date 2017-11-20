'use strict'

const sort = new Intl.Collator(ARGS.locale, {
  numeric: true
})

const search = new Intl.Collator(ARGS.locale, {
  numeric: true,
  usage: 'search',
  sensitivity: 'base'
})

const { any } = require('./common/util')

module.exports = {
  compare(a, b) {
    return sort.compare(a, b)
  },

  by(...keys) {
    return (a, b) => sort.compare(any(a, keys), any(b, keys))
  },

  equals(a, b) {
    return 0 === search.compare(a, b)
  },

  startsWith(string, term) {
    return 0 === search.compare(string.slice(0, term.length), term)
  }
}
