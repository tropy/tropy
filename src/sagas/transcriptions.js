import { put, take } from 'redux-saga/effects'
import { create, load } from '../slices/transcriptions.js'
import act from '../actions/photo.js'
import { debug, warn } from '../common/log.js'

export function *transcribe() {
  try {
    while (true) {
      let { error, meta, payload } = yield take([create.type, load.type])

      if (error || !meta.done)
        continue

      let pending =
        Object.values(payload)
          .filter(tr => tr.status === 0)
          .map(tr => tr.id)

      if (pending.length)
        yield put(act.transcribe(pending))
    }
  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *transcribe')

  } finally {
    debug('*transcribe terminated')
  }
}
