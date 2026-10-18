import {
  create, insert, load, remove, restore, update
} from '../slices/transcriptions.js'
import * as activity from '../slices/activities.js'
import { OnlineChannel } from './online.js'
import { getPendingTranscriptions } from '../selectors/transcriptions.js'
import { SETTINGS } from '../constants/index.js'
import { isLinked } from '../account.js'
import act from '../actions/photo.js'
import { debug, warn } from '../common/log.js'

import {
  all,
  call,
  delay,
  put,
  race,
  select,
  take,
  takeEvery as every
} from 'redux-saga/effects'

const POLL_INTERVAL = 20_000

const onAccountChanged = ({ type, payload }) =>
  type === SETTINGS.UPDATE && 'account' in payload

const onTranscriptionAdded = ({ type, error, meta, payload }) =>
  (type === create.type || type === load.type) &&
  !error && meta.done && payload != null

const TRANSCRIPTION_ACTIONS =
  [create, insert, load, remove, restore, update].map(a => a.type)

const canPoll = () =>
  isLinked() && navigator.onLine

// Tracks the batch of pending transcriptions being collected
// as a single activity, which lasts while the account is linked
// and there are pending transcriptions. The batch's total grows
// as more transcriptions become pending.
export function *track (batch, pending) {
  if (!(isLinked() && pending.length)) {
    if (batch)
      yield put(activity.done(batch.handle))
    return null
  }

  if (!batch) {
    batch = {
      handle: activity.start('transcription.process', {
        statusIcon: 'TranscriptionStatus'
      }),
      seen: new Set()
    }
    yield put(batch.handle)
  }

  let { size } = batch.seen

  for (let tr of pending)
    batch.seen.add(tr.id)

  let total = batch.seen.size
  let progress = total - pending.length + 1

  if (total !== size || progress !== batch.progress) {
    batch.progress = progress
    yield put(activity.update(batch.handle, { total, progress }))
  }

  return batch
}

function *poll () {
  let online = OnlineChannel()
  let batch = null
  let next = 0

  try {
    while (true) {
      let pending = yield select(getPendingTranscriptions)
      batch = yield call(track, batch, pending)

      let ready = canPoll() && pending.length > 0

      if (ready && Date.now() >= next) {
        yield put(act.transcribe(pending.map(tr => tr.id), {
          poll: true,
          hidden: true
        }))
        next = Date.now() + POLL_INTERVAL
      }

      yield race({
        change: take(TRANSCRIPTION_ACTIONS),
        account: take(onAccountChanged),
        connect: take(online),
        ...(ready && { poll: delay(next - Date.now()) })
      })
    }
  } finally {
    if (batch)
      yield put(activity.done(batch.handle))

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
