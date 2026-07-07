import {
  create, insert, load, remove, restore, update
} from '../slices/transcriptions.js'
import { OnlineChannel } from './online.js'
import { getPendingTranscriptions } from '../selectors/transcriptions.js'
import { SETTINGS } from '../constants/index.js'
import { isLinked } from '../account.js'
import act from '../actions/photo.js'
import { delay } from '../common/util.js'
import { debug, warn } from '../common/log.js'

import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeEvery as every
} from 'redux-saga/effects'

const POLL_INTERVAL = 20_000

const onAccountLinked = ({ type, payload }) =>
  type === SETTINGS.UPDATE && 'account' in payload && isLinked()

const onTranscriptionAdded = ({ type, error, meta }) =>
  (type === create.type || type === load.type) && !error && meta.done

const TRANSCRIPTION_ACTIONS =
  [create, insert, load, remove, restore, update].map(a => a.type)

const canPoll = () =>
  isLinked() && navigator.onLine

function *poll () {
  let online = OnlineChannel()

  try {
    while (true) {
      let pending = yield select(getPendingTranscriptions)

      while (!(canPoll() && pending.length)) {
        yield race({
          change: take(TRANSCRIPTION_ACTIONS),
          link: take(onAccountLinked),
          connect: take(online)
        })
        pending = yield select(getPendingTranscriptions)
      }

      yield put(act.transcribe(pending.map(tr => tr.id), { poll: true }))
      yield call(delay, POLL_INTERVAL)
    }
  } finally {
    online.close()
    debug('*poll terminated')
  }
}

function *submit ({ payload }) {
  let ids = Object.values(payload)
    .filter(tr => tr.status === 0)
    .map(tr => tr.id)

  if (ids.length)
    yield put(act.transcribe(ids))
}

export function *transcribe () {
  try {
    yield all([
      call(poll),
      every(onTranscriptionAdded, submit)
    ])
  } catch (err) {
    warn({ err }, 'unexpected error in *transcribe')
  } finally {
    debug('*transcribe terminated')
  }
}
