import { createSlice } from '@reduxjs/toolkit'
import { pick } from '../common/util.js'
import { done } from './cmd.js'

/*
 * Activities track long-running tasks for display in the UI.
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
 */

const PROPS = [
  'agent',
  'cancel',
  'hidden',
  'statusIcon'
]

// Matches the done action that ends an activity.
export const stop = { match: done.match }

const activities = createSlice({
  name: 'activities',
  initialState: {},

  reducers: {
    start: {
      prepare: (action, meta) => ({
        payload: { type: action.type, ...pick(action.meta, PROPS) },
        meta: { ...meta, rel: action.meta.seq }
      }),
      reducer (state, { payload: { type, ...props }, meta }) {
        let activity = state[meta.rel] = {
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
      reducer (state, { meta }) {
        let activity = state[meta.rel]
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
      reducer (state, { meta }) {
        let activity = state[meta.rel]
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
      reducer (state, { payload, meta }) {
        if (meta.rel in state)
          Object.assign(state[meta.rel], payload)
      }
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(stop.match, (state, { meta }) => {
        delete state[meta.rel]
      })
  }
})

export const {
  cancel,
  resume,
  start,
  suspend,
  update
} = activities.actions

export default activities.reducer
