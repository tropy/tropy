import { ipcRenderer as ipc } from 'electron'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log.js'
import { seq, debounce, throttle, log } from '../middleware/index.js'

import {
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
    onError(e) {
      fatal({ stack: e.stack }, 'unhandled error in saga middleware')
      ipc.send('error', e)
    }
  })

  let store = configureStore({
    reducer: {
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
