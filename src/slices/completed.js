import { createSelector, createSlice, lruMemoize } from '@reduxjs/toolkit'

/*
 * Completed Activities:
 * the last completed run of each activity type.
 *
 * Activities are recorded on their done action,
 * and are kept meta.maxAge (default one day).
 *
 * To record activity set `meta.sticky` or `meta.agent`;
 * or use `meta.hidden` to hide.
 */

export const isExpired = (record, now) =>
  !(record.expires >= now)

const isRecorded = ({ meta }) =>
  !!meta?.done && !meta.cancelled && !meta.hidden &&
  !!(meta.sticky || meta.agent)

function record ({ type, error, meta }) {
  let rec = {
    type,
    init: meta.was,
    done: meta.now,
    expires: meta.now + (meta.maxAge ?? 24 * 60 * 60 * 1000)
  }

  let errors = meta.errors || (error ? 1 : 0)

  if (meta.agent) rec.agent = meta.agent
  if (error) rec.failed = true
  if (errors) rec.errors = errors
  if (meta.refs?.length) rec.refs = meta.refs
  if (meta.sticky) rec.sticky = true

  return rec
}

const completed = createSlice({
  name: 'completed',
  initialState: {},

  reducers: {
    // Searches: the record may be the view's (see reducers/nav.js).
    dismiss: {
      prepare: (type, meta) => ({
        payload: type,
        meta: { search: true, ...meta }
      }),
      reducer (state, { payload: type }) {
        delete state[type]
      }
    },

    // Replaces the records, as the window may switch projects.
    restore (_, { payload, meta }) {
      let state = {}

      for (let rec of Object.values(payload ?? {}))
        if (!isExpired(rec, meta.now))
          state[rec.type] = rec

      return state
    }
  },

  extraReducers: (builder) => {
    builder.addMatcher(isRecorded, (state, action) => {
      state[action.type] = record(action)
    })
  }
})

// The type of the completed activity shown (nav.view), if any.
const selectShownType = ({ nav }) =>
  (nav?.view.name === 'activity' && nav.view.seq == null) ?
    nav.view.type : null

// Live sticky records, most recent first.
// The record shown stays while shown, also if expired:
// what is selected is visible.
export const selectCompletedActivities = createSelector(
  [({ completed }) => completed, (_, now) => now, selectShownType],
  (completed, now, shown) =>
    Object.values(completed)
      .filter(rec => rec.sticky &&
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
