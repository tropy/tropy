'use strict'

const { debug } = require('../common/log')
debug('prefs saga 1')

const { CLOSE } = require('../constants/prefs')
debug('prefs saga 2')
const { ontology } = require('./ontology')
debug('prefs saga 3')
const { history } = require('./history')
debug('prefs saga 4')
const { ipc } = require('./ipc')
debug('prefs saga 5')
const { shell } = require('./shell')
debug('prefs saga 6')
const { warn } = require('../common/log')
debug('prefs saga 7')
const storage = require('./storage')

debug('prefs saga 8')
const {
  all, call, cancel, cancelled, fork, take
} = require('redux-saga/effects')
debug('prefs saga 9')

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

      yield all([
        call(storage.restore, 'prefs'),
        call(storage.restore, 'settings')
      ])

      debug('*prefs.main ready')
      yield take(CLOSE)

    } catch (e) {
      warn(`unexpected error in *prefs.main: ${e.message}`, {
        stack: e.stack
      })

    } finally {
      yield all([
        call(storage.persist, 'prefs'),
        call(storage.persist, 'settings')
      ])

      if (!(yield cancelled())) {
        yield all(aux.map(t => cancel(t)))
      }

      debug('*prefs.main terminated')
    }
  }
}
debug('prefs saga 10')
