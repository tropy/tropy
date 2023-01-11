import { createSlice } from '@reduxjs/toolkit'

const notepad = createSlice({
  name: 'notepad',
  initialState: {},

  reducers: {
    restore(state, { payload }) {
      return payload
    },

    update(state, { payload }) {
      for (let [id, data] of Object.entries(payload)) {
        state[id] = Object.assign(state[id] || {}, data)
      }
    }
  }
})

export const {
  restore,
  update
} = notepad.actions

export default notepad.reducer
