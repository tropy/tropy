import { createSelector, createSlice, lruMemoize } from '@reduxjs/toolkit'
import { pick } from '../common/util.js'
import { done } from './cmd.js'

/*
 * Activities track long-running tasks for display in the UI:
 * the busy ones, by id, and the past ones, by type.
 *
 * Each activity follows a dispatched trigger action,
 * keyed by the trigger's meta.seq:
 *   1. start(action) when the task actually begins;
 *   2. update, suspend or resume with the same action while busy;
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

// Activity ids are sequential per window,
// we restore using negative ids to avoid clashes with new activities.
export const restoreId = (id) =>
  (id == null) ? null : -Math.abs(id)

export const isExpired = (record, now) =>
  !(record.expires >= now)

const isDoneOrRemote = (action) =>
  stop.match(action) || !!action.meta?.agent

// Whether isDoneOrRemote should be kept as past activity.
function keep ({ meta }, busy) {
  if (meta.hidden)
    return false
  if (!meta.done)
    return !meta.cmd // Not a command, so agent/api UI action

  let items = meta.items ?? busy?.items

  return meta.cancelled
    ? items?.length > 0
    : !!(items || meta.agent || meta.history)
}

// Converts an action into a past activity record.
function preserve ({ type, error, meta }, busy) {
  let record = {
    type,
    done: meta.now,
    expires: meta.now + 24 * 60 * 60 * 1000
  }

  let errors = meta.errors || (error ? 1 : 0)
  let items = meta.items ?? busy?.items

  if (meta.rel != null) record.id = meta.rel
  if (meta.cancelled) record.cancelled = true
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
        meta: {
          ...meta,
          rel: id
        }
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
      prepare: (type, id, meta) => ({
        payload: { type, id: id ?? null },
        meta: {
          search: true, // In case the view is active!
          ...meta
        }
      }),
      reducer ({ past }, { payload }) {
        delete past[payload.type]
      }
    },

    restore (state, { payload, meta }) {
      let past = {}

      for (let record of Object.values(payload?.past ?? {}))
        if (!isExpired(record, meta.now))
          past[record.type] = {
            ...record,
            id: restoreId(record.id)
          }

      state.past = past
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(isDoneOrRemote, (state, action) => {
        let busy = state.busy[action.meta.rel]

        if (keep(action, busy))
          state.past[action.type] = preserve(action, busy)

        if (stop.match(action))
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

// The activity a view (type, id) refers to: the busy activity with
// that id, else the past activity of its type. So a view stays with
// its activity when it is done, and moves on when a newer activity
// of its type replaces the past one.
export function selectActivity ({ activities }, { type, id }) {
  let activity = (id != null) ? activities.busy[id] : null
  return (activity?.type === type)
    ? activity
    : (activities.past[type] ?? null)
}

// The selected activity (nav.view), if any.
export const selectSelectedActivity = (state) =>
  (state.nav?.view.name === 'activity')
    ? selectActivity(state, state.nav.view)
    : null

// The selected past activity stays, also if expired:
// what is selected is visible.
export const selectPastActivities = createSelector(
  [
    ({ activities }) => activities.past,
    (_, now) => now,
    selectSelectedActivity
  ],
  (past, now, selected) =>
    Object.values(past)
      .filter(rec => rec.items != null &&
        (!isExpired(rec, now) || rec === selected))
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
