import { createSlice } from '@reduxjs/toolkit'
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
    })
  }
})


export const {
  create,
  load,
  restore
} = transcriptions.actions

export default transcriptions.reducer
