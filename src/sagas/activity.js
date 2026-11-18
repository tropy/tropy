import { put, select } from 'redux-saga/effects'
import { update } from '../slices/activities.js'

// Updates a live activity (see activity.update).
// Sets meta.search if the activity has items and is currently selected.
export function *putActivityUpdate (action, payload) {
  let search = ('items' in payload) &&
    (yield select(activeView, action.meta.seq))

  yield put(update(action, payload, { search }))
}

const activeView = ({ nav }, id) =>
  nav.view.name === 'activity' && nav.view.id === id
