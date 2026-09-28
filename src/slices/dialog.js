import { createSlice } from '@reduxjs/toolkit'

const dialog = createSlice({
  name: 'dialog',
  initialState: null,

  reducers: {
    open (state, { payload }) {
      return payload
    },

    close () {
      return null
    }
  }
})

export const {
  close,
  open
} = dialog.actions

export default dialog.reducer
