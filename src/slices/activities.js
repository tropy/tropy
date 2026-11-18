import { createSelector, createSlice, lruMemoize } from '@reduxjs/toolkit'
import { omit, pick } from '../common/util.js'
import { done } from './cmd.js'

/*
 * Activities track long-running tasks for display in the UI:
 * the busy ones, by id, and the past ones, by type.
 *
 * Each activity follows a dispatched trigger action,
 * keyed by the trigger's meta.seq:
 *   1. start(action) when the task actually begins;
 *   2. update, suspend or resume with the same action while it runs;
 *   3. the task's done(action) response stops the activity.
 *
 * Whoever starts an activity must guarantee to dispatch done(action).
 * Commands do this in *exec; other tasks dispatch their own trigger,
 * like the transcription collector or a thunk via dispatch().
 *
 * Activity props (agent, cancel, hidden, statusIcon)
 * are taken from the trigger's meta.
 *
 * Past activities: the last completed activity of each type,
 * recorded on its done action if it meets the `keep` condition,
 * and kept one day.
 */

const PROPS = [
  'agent',
  'cancel',
  'hidden',
  'statusIcon'
]

// Matches the done action that ends an activity.
export const stop = { match: done.match }

export const isExpired = (record, now) =>
  !(record.expires >= now)

// Whether a done action is recorded as a past activity.
export const keep = ({ meta }, busy) =>
  !!meta?.done && !meta.cancelled && !meta.hidden && !!(
    meta.items || busy?.items || meta.agent || meta.history
  )

// Converts done action into a past activity record.
function preserve ({ type, error, meta }, busy) {
  let record = {
    type,
    id: meta.rel,
    done: meta.now,
    expires: meta.now + 24 * 60 * 60 * 1000
  }

  let errors = meta.errors || (error ? 1 : 0)
  let items = meta.items ?? busy?.items

  if (meta.agent) record.agent = meta.agent
  if (errors) record.errors = errors
  if (items) record.items = items

  return record
}

const activities = createSlice({
  name: 'activities',
  initialState: {
    busy: {},
    past: {}
  },

  reducers: {
    start: {
      prepare: (action, meta) => ({
        payload: { type: action.type, ...pick(action.meta, PROPS) },
        meta: { log: 'trace', ...meta, rel: action.meta.seq }
      }),
      reducer ({ busy }, { payload: { type, ...props }, meta }) {
        let activity = busy[meta.rel] = {
          id: meta.rel,
          type,
          due: meta.now + 400
        }

        for (let prop of PROPS)
          if (props[prop] !== undefined)
            activity[prop] = props[prop]
      }
    },

    cancel: {
      prepare: (id, meta) => ({
        payload: { id },
        meta: { ...meta, rel: id }
      }),
      reducer () {}
    },

    suspend: {
      prepare: (action, meta) => ({
        meta: {
          ...meta,
          rel: action.meta.seq
        }
      }),
      reducer ({ busy }, { meta }) {
        let activity = busy[meta.rel]
        if (activity && meta.now < activity.due)
          activity.suspended = meta.now
      }
    },

    resume: {
      prepare: (action, meta) => ({
        meta: {
          ...meta,
          rel: action.meta.seq
        }
      }),
      reducer ({ busy }, { meta }) {
        let activity = busy[meta.rel]
        if (activity?.suspended == null)
          return

        activity.due += meta.now - activity.suspended
        delete activity.suspended
      }
    },

    update: {
      prepare: (action, payload, meta) => ({
        payload,
        meta: {
          ...meta,
          rel: action.meta.seq,
          was: action.meta.now
        }
      }),
      reducer ({ busy }, { payload, meta }) {
        if (meta.rel in busy)
          Object.assign(busy[meta.rel], payload)
      }
    },

    dismiss: {
      prepare: (type, meta) => ({
        payload: type,
        meta: {
          search: true, // In case the view is active!
          ...meta
        }
      }),
      reducer ({ past }, { payload: type }) {
        delete past[type]
      }
    },

    restore (state, { payload, meta }) {
      let past = {}

      // Drop the id on restore, because activity ids are sequential.
      for (let record of Object.values(payload?.past ?? {}))
        if (!isExpired(record, meta.now))
          past[record.type] = omit(record, ['id'])

      state.past = past
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(stop.match, (state, action) => {
        let busy = state.busy[action.meta.rel]

        if (keep(action, busy))
          state.past[action.type] = preserve(action, busy)

        delete state.busy[action.meta.rel]
      })
  }
})

// Visible busy activities, newest first.
export const selectBusyActivities = createSelector(
  ({ activities }) => activities.busy,
  (busy) =>
    Object.values(busy)
      .filter(a => !a.hidden)
      .sort((a, b) => b.id - a.id)
)

// The type of the past activity shown (nav.view), if any.
const selectActiveType = ({ nav }) =>
  (nav?.view.name === 'activity' && nav.view.id == null) ?
    nav.view.type : null

export const selectPastActivities = createSelector(
  [({ activities }) => activities.past, (_, now) => now, selectActiveType],
  (past, now, shown) =>
    Object.values(past)
      .filter(rec => rec.items != null &&
        (!isExpired(rec, now) || rec.type === shown))
      .sort((a, b) => b.done - a.done),
  {
    // Bounded caches: `now` differs from call to call.
    memoize: lruMemoize,
    argsMemoize: lruMemoize
  }
)

export function selectMostRecentActivity ({ activities }, now) {
  let last = null

  for (let rec of Object.values(activities.past))
    if (!isExpired(rec, now) && (last == null || rec.done > last.done))
      last = rec

  return last
}

export const {
  cancel,
  dismiss,
  restore,
  resume,
  start,
  suspend,
  update
} = activities.actions

export default activities.reducer
