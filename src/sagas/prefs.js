import { all, call, cancel, delay, fork, take, takeLatest } from 'redux-saga/effects'
import { debug, warn } from '../common/log.js'
import { PROJECT } from '../constants/index.js'
import { ontology } from './ontology.js'
import { open } from './project.js'
import { history } from './history.js'
import { ipc } from './ipc.js'
import { persist, restore } from './storage.js'
import { close } from '../slices/prefs.js'

import '../commands/ontology.js'
import '../commands/project.js'

export function *main() {
  try {
    var aux = yield all([
      fork(ontology, { max: 2 }),
      fork(history),
      fork(ipc)
    ])

    aux.START = Date.now()

    yield all([
      call(restore, 'prefs'),
      call(restore, 'settings')
    ])

    let project = yield takeLatest(PROJECT.OPEN, open, {
      max: 1,
      skipFullSetup: true,
      skipIntegrityCheck: true
    })

    debug('*prefs.main ready')
    yield take(close)
    yield cancel(project)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *prefs.main')

  } finally {
    yield all([
      call(persist, 'prefs'),
      call(persist, 'settings')
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
