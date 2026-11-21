import { createSlice } from '@reduxjs/toolkit'
import { restore, show } from './actions.js'
import { isDone } from '../cmd.js'
import { EDIT, ITEM, NOTE } from '../../constants/index.js'

const mode = {
  __proto__: null,
  project: 'project',
  item: 'item'
}

export const modeSlice = createSlice({
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

      // A missing item is not opened (no payload).
      .addMatcher(isDone(ITEM.OPEN, NOTE.OPEN), (state, { payload }) =>
        (payload != null) ? mode.item : state)
  }
})
