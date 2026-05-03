import { createSlice } from '@reduxjs/toolkit'
import { createIpcAction } from './util.js'
import { prompt } from '../dialog.js'


export const link = createIpcAction('account/link')

export const status = createIpcAction('account/status')

export const unlink = createIpcAction('account/unlink', {
  condition: () =>
    prompt('account.unlink', { type: 'warning' })
      .then(({ cancel }) => !cancel)
})

const initialState = {
  linked: false,
  username: null,
  status: 'idle',
  error: null
}

const account = createSlice({
  name: 'account',
  initialState,

  reducers: {
    update: (state, { payload }) => ({
      ...state,
      ...payload
    })
  },

  extraReducers (builder) {
    builder
      .addAsyncThunk(link, {
        pending: (_, { meta }) => ({
          ...initialState,
          status: 'pending',
          username: meta.arg?.username
        }),
        fulfilled: (_, { payload }) => ({
          ...initialState,
          ...payload
        }),
        rejected: (state, { error }) => ({
          ...state,
          status: 'error',
          error: error.code || 'account.link.error'
        })
      })
      .addAsyncThunk(unlink, {
        pending: (state) => ({
          ...state,
          status: 'pending'
        }),
        settled: () => ({
          ...initialState
        })
      })
      .addAsyncThunk(status, {
        pending: (state) => ({
          ...state,
          status: 'pending'
        }),
        settled: (_, { payload }) => ({
          ...initialState,
          ...payload
        })
      })
  }
})

export const {
  update
} = account.actions

export default account.reducer
