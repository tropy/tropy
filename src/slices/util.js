import { createAsyncThunk } from '@reduxjs/toolkit'
import { ipcRenderer } from 'electron'

// Helper for creating perpare/reducer object for RTK reducers
export const createMetaReducer = (props, reducer) => ({
  prepare: (payload, meta = {}) => ({
    payload,
    meta: { ...props, ...meta }
  }),
  reducer
})

export const cmdReducer = (reducer, name = 'project') =>
  createMetaReducer({ cmd: name }, reducer)

export const createIpcAction = (type, prepare, opts) => {
  let [channel, cmd] = type.split('/', 2)

  if (typeof prepare !== 'function') {
    opts = prepare
    prepare = (arg) => arg
  }

  return createAsyncThunk(type, async (...args) => {
    let arg = await prepare(...args)
    return ipcRenderer.invoke(channel, cmd, arg)
  }, opts)
}
