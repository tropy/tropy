import { createNextState, createSlice } from '@reduxjs/toolkit'
import { cmdReducer } from './util.js'


const transcriptions = createSlice({
  name: 'transcriptions',
  initialState: {},

  reducers: {
    create: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    load: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    remove: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        for (let id of payload) delete state[id]
    }),

    restore: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    update: (state, { payload }) => {
      Object.assign(state, payload)
    }
  }
})

export const nested = {
  create(state, { payload, meta, error }) {
    return (!meta.done || error) ?
      state : createNextState(state, draft => {
        for (let tr of Object.values(payload)) {
          draft[tr.parent]?.transcriptions.push(tr.id)
        }
        return draft
      })
  },

  remove(state, { payload, meta, error }) {
    return (!meta.done || error) ?
      state : createNextState(state, draft => {
        for (let tr of payload) {
          if (tr.idx >= 0 && tr.parent in draft)
            draft[tr.parent].transcriptions.splice(tr.idx, 1)
        }
        return draft
      })
  },

  restore(state, { payload, meta, error }) {
    return (!meta.done || error) ?
      state : createNextState(state, draft => {
        for (let tr of payload) {
          draft[tr.parent]?.transcriptions.splice(tr.idx, 0, tr.id)
        }
        return draft
      })
  }
}

export const {
  create,
  load,
  remove,
  restore,
  update
} = transcriptions.actions

export default transcriptions.reducer
