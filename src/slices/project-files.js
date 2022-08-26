import { basename, dirname } from 'node:path'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { pstat } from '../common/project.js'
import { pMap } from '../common/util.js'
import { warn } from '../common/log.js'
import { open } from '../dialog.js'


export const reload = createAsyncThunk(
  'projectFiles/reload',
  async (files, { getState }) => {
    let cache = getState().projectFiles
    let concurrency = Math.min(Math.round(files.length / 2), 8)
    let result = []

    await pMap(files, async path => {
      try {
        var { lastModified, ...prevStats } = cache[path] || {}
        let stats = await pstat(path, lastModified)

        if (stats) {
          result.push(stats)
        }

      } catch (e) {
        warn({ stack: e.stack }, `failed to stat project file '${path}'`)

        result.push({
          ...prevStats,
          path,
          name: basename(path),
          lastModified: null
        })
      }
    }, { concurrency })

    return result
  })

export const consolidate = createAsyncThunk(
  'projectFiles/consolidate',
  async (path, { fulfillWithValue }) => {

    let [newPath] = await open.project({
      defaultPath: dirname(path)
    })

    return fulfillWithValue({ path, newPath }, {
      ipc: newPath ? 'clear-recent-project' : false
    })
  }
)

const projectFiles = createSlice({
  name: 'projectFiles',
  initialState: {},

  reducers: {
    clear: {
      reducer(state, { payload }) {
        delete state[payload]
      },
      prepare: (path) => ({
        payload: { path },
        meta: { ipc: 'clear-recent-project' }
      })
    },

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
      .addCase(consolidate.fulfilled, (state, { payload }) => {
        if (payload.newPath) {
          delete state[payload.path]
        }
      })
  }
})

export const {
  clear,
  restore
} = projectFiles.actions

export default projectFiles.reducer
