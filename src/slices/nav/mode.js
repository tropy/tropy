import { createSlice } from '@reduxjs/toolkit'
import { itemOpened, restored, viewShown } from './actions.js'
import { EDIT } from '../../constants/index.js'

const mode = {
  __proto__: null,
  project: 'project',
  item: 'item'
}

const modeSlice = createSlice({
  name: 'nav/mode',
  initialState: mode.project,

  reducers: {
    itemClosed: () => mode.project
  },

  extraReducers: (builder) => {
    builder
      .addCase(restored, (_, { payload }) =>
        mode[payload?.mode] ?? mode.project)

      .addCase(viewShown, () => mode.project)

      .addCase(EDIT.START, (state, { payload }) =>
        (payload.tag || payload.list) ? mode.project : state)

      .addCase(itemOpened, () => mode.item)
  }
})

export default modeSlice
