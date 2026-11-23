import { createSlice } from '@reduxjs/toolkit'
import { restore, show } from './actions.js'
import { EDIT, ITEM } from '../../constants/index.js'

const mode = {
  __proto__: null,
  project: 'project',
  item: 'item'
}

const modeSlice = createSlice({
  name: 'nav/mode',
  initialState: mode.project,

  reducers: {
    back: () => mode.project
  },

  extraReducers: (builder) => {
    builder
      .addCase(restore, (_, { payload }) =>
        mode[payload?.mode] ?? mode.project)

      .addCase(show, () => mode.project)

      .addCase(EDIT.START, (state, { payload }) =>
        (payload.tag || payload.list) ? mode.project : state)

      // The mode hint: 'item' from item.open.
      .addCase(ITEM.SELECT, (state, { payload }) =>
        mode[payload.mode] ?? state)
  }
})

export default modeSlice
