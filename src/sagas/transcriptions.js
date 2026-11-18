import {
  create, insert, load, collect, remove, restore, update
} from '../slices/transcriptions.js'
import * as activity from '../slices/activities.js'
import { putActivityUpdate } from './activity.js'
import { done } from '../slices/cmd.js'
import { OnlineChannel } from './online.js'
import { getPendingTranscriptions } from '../selectors/transcriptions.js'
import { SETTINGS } from '../constants/index.js'
import { isLinked } from '../account.js'
import act from '../actions/photo.js'
import { trace, warn } from '../common/log.js'

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
    // Pending transcriptions are left when the account was unlinked:
    // the batch ends all the same, as it was not cancelled.
    // Its items are those shown while busy, pending or not.
    // Searches: the batch's items may be shown (an activity view).
    if (batch) {
      yield put(done(batch.handle, null, {
        search: true,
        items: yield select(getBatchItems, batch.seen),
        errors: yield select(getBatchErrors, batch.seen)
      }))
    }
    return null
  }

  if (!batch) {
    batch = {
      handle: yield put(collect()),
      seen: new Set()
    }
    yield put(activity.start(batch.handle))
  }

  let { size } = batch.seen

  for (let tr of pending)
    batch.seen.add(tr.id)

  let total = batch.seen.size
  let progress = total - pending.length + 1

  if (total !== size || progress !== batch.progress) {
    batch.progress = progress
    yield* putActivityUpdate(batch.handle, {
      total,
      progress,
      items: yield select(getBatchItems, batch.seen)
    })
  }

  return batch
}

// The item of a transcription (of a photo or a selection), if any.
const getItem = (state, tr) => (
  state.photos[tr.parent] ??
  state.photos[state.selections[tr.parent]?.photo]
)?.item

// The items being transcribed in a batch, pending or not.
function getBatchItems (state, ids) {
  let items = new Set()

  for (let id of ids) {
    let tr = state.transcriptions[id]
    let item = tr && getItem(state, tr)

    if (item != null)
      items.add(item)
  }

  return [...items]
}

// The number of a batch's failed transcriptions.
function getBatchErrors (state, ids) {
  let errors = 0

  for (let id of ids)
    if (state.transcriptions[id]?.status < 0)
      errors++

  return errors
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
    // Not recorded: the batch did not finish.
    if (batch)
      yield put(done(batch.handle, null, { cancelled: true }))

    online.close()
    trace('*poll terminated')
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
    // Submits what was left unsubmitted when the project opens.
    yield call(submit, {
      payload: yield select(state => state.transcriptions)
    })

    yield all([
      call(poll),
      every(onTranscriptionAdded, submit)
    ])
  } catch (err) {
    warn({ err }, 'unexpected error in *transcribe')
  } finally {
    trace('*transcribe terminated')
  }
}
