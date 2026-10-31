import { createSlice } from '@reduxjs/toolkit'
import { pick } from '../common/util.js'

const PROPS = [
  'cancel',
  'hidden',
  'statusIcon'
]

export const start = (type, meta) => ({
  type,
  meta: { ...meta, activity: true }
})

// Matches all actions starting an activity, including commands.
start.match = ({ meta }) =>
  (meta?.cmd != null || meta?.activity === true) && !meta.done

export function done (action, result, meta) {
  let error = result instanceof Error
  let payload = !error ?
    result :
    pick(result, ['code', 'message', 'stack', 'type'])

  return {
    type: action.type,
    payload,
    error,
    meta: {
      idx: action.meta.idx,
      ipc: action.meta.ipc,
      log: action.meta.log,
      rsvp: action.meta.rsvp,
      search: action.meta.search,
      ...meta,
      done: true,
      rel: action.meta.seq,
      was: action.meta.now
    }
  }
}

// Matches all actions finishing an activity.
done.match = ({ meta }) => !!meta?.done

const activities = createSlice({
  name: 'activities',
  initialState: {},

  reducers: {
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
        state[meta.rel] = {
          ...state[meta.rel],
          ...payload
        }
      }
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(done.match, (state, { meta }) => {
        delete state[meta.rel]
      })
      .addMatcher(start.match, (state, { type, meta }) => {
        let activity = state[meta.seq] = {
          id: meta.seq,
          type,
          due: meta.now + 400
        }

        for (let prop of PROPS)
          if (meta[prop] !== undefined)
            activity[prop] = meta[prop]
      })
  }
})

export const {
  cancel,
  resume,
  suspend,
  update
} = activities.actions

export default activities.reducer
