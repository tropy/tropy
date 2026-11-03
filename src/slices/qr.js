import { createSlice } from '@reduxjs/toolkit'

const qr = createSlice({
  name: 'qr',
  initialState: { items: [] },

  reducers: {
    update: {
      prepare: (payload = {}, meta) => ({
        payload,
        meta: { log: 'debug', ...meta }
      }),

      reducer: (state, { payload }) => ({
        ...state,
        ...payload
      })
    }
  }
})

export const {
  update
} = qr.actions

export const selectItemSequence = (state) => state.qr.items

export default qr.reducer
