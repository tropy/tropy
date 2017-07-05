'use strict'

const coll = new Intl.Collator(ARGS.locale, { numeric: true })
const { any } = require('common/util')

module.exports = {
  compare(a, b) {
    return coll.compare(a, b)
  },

  by(...keys) {
    return (a, b) => coll.compare(any(a, keys), any(b, keys))
  }
}
