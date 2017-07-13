'use strict'

const { CLOSE } = require('../constants/prefs')
const { ontology } = require('./ontology')
const { history } = require('./history')
const { ipc } = require('./ipc')
const { shell } = require('./shell')
const { warn, debug, verbose } = require('../common/log')
const storage = require('./storage')

const {
  all, call, cancel, cancelled, fork, take
} = require('redux-saga/effects')

module.exports = {
  *main() {
    let aux

    try {
      aux = yield all([
        fork(ontology),
        fork(history),
        fork(ipc),
        fork(shell)
      ])

      yield all([
        call(storage.restore, 'prefs'),
        call(storage.restore, 'settings')
      ])

      yield take(CLOSE)

    } catch (error) {
      warn(`unexpected error in *prefs.main: ${error.message}`)
      debug(error.stack)

    } finally {
      yield all([
        call(storage.persist, 'prefs'),
        call(storage.persist, 'settings')
      ])

      if (!(yield cancelled())) {
        yield all(aux.map(t => cancel(t)))
      }

      verbose('*prefs.main terminated')
    }
  }
}
