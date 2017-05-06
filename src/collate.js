'use strict'

const coll = new Intl.Collator(ARGS.locale, { numeric: true })

module.exports = {
  compare(a, b) {
    return coll.compare(a, b)
  },

  by(key) {
    return (a, b) => coll.compare(a[key], b[key])
  }
}
