import { createSelector, createSlice, lruMemoize } from '@reduxjs/toolkit'
import { omit } from '../common/util.js'

/*
 * Completed Activities:
 * the last completed run of each activity type.
 *
 * Activities are recorded on their done action,
 * and kept one day if they meet the `keep` condition.
 */

export const isExpired = (record, now) =>
  !(record.expires >= now)

const keep = ({ meta }) =>
  !!meta?.done && !meta.cancelled && !meta.hidden && !!(
    meta.items || meta.agent || meta.history
  )

function preserve ({ type, error, meta }) {
  let record = {
    type,
    id: meta.rel,
    done: meta.now,
    expires: meta.now + 24 * 60 * 60 * 1000
  }

  let errors = meta.errors || (error ? 1 : 0)

  if (meta.agent) record.agent = meta.agent
  if (errors) record.errors = errors
  if (meta.items) record.items = meta.items

  return record
}

const completed = createSlice({
  name: 'completed',
  initialState: {},

  reducers: {
    dismiss: {
      prepare: (type, meta) => ({
        payload: type,
        meta: {
          search: true,
          ...meta
        }
      }),
      reducer (state, { payload: type }) {
        delete state[type]
      }
    },

    restore (_, { payload, meta }) {
      let state = {}

      // Drops the ids: their runs are gone, and ids repeat across sessions.
      for (let record of Object.values(payload ?? {}))
        if (!isExpired(record, meta.now))
          state[record.type] = omit(record, ['id'])

      return state
    }
  },

  extraReducers: (builder) => {
    builder.addMatcher(keep, (state, action) => {
      state[action.type] = preserve(action)
    })
  }
})

// The type of the completed activity shown (nav.view), if any.
const selectShownType = ({ nav }) =>
  (nav?.view.name === 'activity' && nav.view.id == null) ?
    nav.view.type : null

// Live records with items (also none, e.g. a failed import),
// most recent first.
// The record shown stays while shown, also if expired:
// what is selected is visible.
export const selectCompletedActivities = createSelector(
  [({ completed }) => completed, (_, now) => now, selectShownType],
  (completed, now, shown) =>
    Object.values(completed)
      .filter(rec => rec.items != null &&
        (!isExpired(rec, now) || rec.type === shown))
      .sort((a, b) => b.done - a.done),
  {
    // Bounded caches: `now` differs from call to call.
    memoize: lruMemoize,
    argsMemoize: lruMemoize
  }
)

export function selectLastCompleted ({ completed }, now) {
  let last = null

  for (let rec of Object.values(completed))
    if (!isExpired(rec, now) && (last == null || rec.done > last.done))
      last = rec

  return last
}

export const {
  dismiss,
  restore
} = completed.actions

export default completed.reducer
