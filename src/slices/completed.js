import { createSlice } from '@reduxjs/toolkit'
import { done } from './cmd.js'

export const isExpired = (run, now) =>
  now - run.done > run.keep

const keep = (action) =>
  done.match(action) && action.meta.keep > 0

function asCompleted ({ type, error, meta }) {
  let run = {
    type,
    init: meta.was,
    done: meta.now,
    keep: meta.keep
  }

  let errors = meta.errors || (error ? 1 : 0)

  if (meta.agent) run.agent = meta.agent
  if (meta.cancelled) run.cancelled = true
  if (meta.refs?.length) run.refs = meta.refs
  if (errors) run.errors = errors

  return run
}

const completed = createSlice({
  name: 'completed',
  initialState: [],

  reducers: {
    dismiss: {
      prepare: (type, meta) => ({ payload: type, meta }),
      reducer: (state, { payload: type }) =>
        state.filter(run => run.type !== type)
    },

    // Replaces the runs, as the window may switch projects.
    restore: (_, { payload, meta }) =>
      Array.isArray(payload) ?
        payload.filter(run => !isExpired(run, meta.now)) : []
  },

  extraReducers: (builder) => {
    builder.addMatcher(keep, (state, action) => {
      state.push(asCompleted(action))
    })
  }
})

export const {
  dismiss,
  restore
} = completed.actions

export default completed.reducer
