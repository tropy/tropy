import { createSlice } from '@reduxjs/toolkit'

const transcriptions = createSlice({
  name: 'transcriptions',
  initialState: {},

  reducers: {
    load: {
      prepare: (payload, meta = {}) => ({
        payload,
        meta: { cmd: 'project', ...meta }
      }),
      reducer(state, { payload, meta, error }) {
        if (meta.done && !error)
          Object.assign(state, payload)
      }
    }
  }
})


export const {
  load
} = transcriptions.actions

export default transcriptions.reducer
