import { createAction, createSlice } from '@reduxjs/toolkit'

const initialState = {
  pane: 'app'
}

const prefs = createSlice({
  name: 'prefs',
  initialState,

  reducers: {
    restore(state, { payload }) {
      Object.assign(state, initialState, payload)
    },

    update(state, { payload }) {
      Object.assign(state, payload)
    }
  }
})

export const close = createAction('prefs/close')

export const  {
  restore,
  update
} = prefs.actions

export default prefs.reducer
