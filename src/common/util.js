'use strict'

const B = require('bluebird')


module.exports = {

  once(emitter, event) {
    return new B((resolve, reject) => {
      const on = (emitter.on || emitter.addEventListener).bind(emitter)
      const off = (emitter.removeListener || emitter.removeEventListener)
        .bind(emitter)

      function success(...args) {
        off(event, success)
        off('error', failure)

        resolve(...args)
      }

      function failure(...args) {
        off(event, success)
        off('error', failure)

        reject(...args)
      }

      on('error', failure)
      on(event, success)
    })
  },

  times(n, fn) {
    for (var i = 0, res = []; i < n; ++i) res.push(fn(i))
    return res
  }
}
