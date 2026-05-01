import { ipcRenderer as ipc } from 'electron'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log.js'
import { seq, debounce, throttle, log } from '../middleware/index.js'

import {
  account,
  context,
  edit,
  flash,
  history,
  intl,
  keymap,
  ontology,
  prefs,
  project,
  settings
} from '../reducers/index.js'


export const create = () => {
  let saga = createSagaMiddleware({
    onError (err) {
      fatal({ err }, 'unhandled error in saga middleware')
      ipc.send('error', {
        message: err.message,
        stack: err.stack,
        code: err.code
      })
    }
  })

  let store = configureStore({
    reducer: {
      account,
      context,
      edit,
      flash,
      history,
      intl,
      keymap,
      ontology,
      prefs,
      project,
      settings
    },
    middleware: (getDefaultMiddleWare) => ([
      ...getDefaultMiddleWare(),
      debounce,
      throttle,
      seq,
      log,
      saga
    ])
  })

  return { ...store, saga }
}
