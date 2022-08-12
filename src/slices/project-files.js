import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const reload = createAsyncThunk(
  'projectFiles/reload',
  async (files) => {
    return files.map(path => ({
      path,

      lastModified: Date.now() - Math.floor(Math.random() * 1000000),
      name: 'Project Name',
      items: Math.floor(Math.random() * 1167),
      photos: Math.floor(Math.random() * 4959),
      notes: Math.floor(Math.random() * 182)
    }))
  })


const projectFiles = createSlice({
  name: 'projectFiles',
  initialState: {},

  reducers: {
    restore(state, { payload }) {
      Object.assign(state, payload)
    }
  },

  extraReducers(builder) {
    builder
      .addCase(reload.fulfilled, (state, { payload }) => {
        for (let file of payload) {
          state[file.path] = file
        }
      })
  }
})

export const {
  restore
} = projectFiles.actions

export default projectFiles.reducer
