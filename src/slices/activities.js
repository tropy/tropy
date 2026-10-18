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
          init: meta.now
        }

        for (let prop of PROPS)
          if (meta[prop] !== undefined)
            activity[prop] = meta[prop]
      })
  }
})

export const {
  cancel,
  update
} = activities.actions

export default activities.reducer
