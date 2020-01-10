'use strict'

require('../commands/ontology')

const { debug, warn } = require('../common/log')
const { CLOSE } = require('../constants/prefs')
const { ontology } = require('./ontology')
const { history } = require('./history')
const { ipc } = require('./ipc')
const { shell } = require('./shell')
const storage = require('./storage')

const {
  all, call, cancel, delay, fork, take
} = require('redux-saga/effects')

module.exports = {
  *main() {
    let aux

    try {
      aux = yield all([
        fork(ontology, { max: 2 }),
        fork(history),
        fork(ipc),
        fork(shell)
      ])

      aux.START = Date.now()

      yield all([
        call(storage.restore, 'prefs'),
        call(storage.restore, 'settings')
      ])

      debug('*prefs.main ready')
      yield take(CLOSE)

    } catch (e) {
      warn({ stack: e.stack }, 'unexpected error in *prefs.main')

    } finally {
      yield all([
        call(storage.persist, 'prefs'),
        call(storage.persist, 'settings')
      ])

      // HACK: Ensure we don't cancel aux tasks too early!
      if (Date.now() - aux.START < 1000) {
        yield delay(1000)
      }

      yield cancel(aux)

      // HACK: We cannot wait for cancelled tasks to complete.
      // See redux-saga#1242
      yield delay(200)

      debug('*prefs.main terminated')
    }
  }
}
