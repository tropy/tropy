import { put, select } from 'redux-saga/effects'
import { update } from '../slices/activities.js'

// Updates a live activity (see activity.update).
// An update with items searches if the activity's view is shown,
// so its results stay up to date while it runs;
// elsewhere, its items change no results.
export function *putActivityUpdate (action, payload) {
  let view = yield select(state => state.nav.view)
  let isShown = ('items' in payload) &&
    view.name === 'activity' && view.id === action.meta.seq

  yield put(update(action, payload, isShown ? { search: true } : undefined))
}
