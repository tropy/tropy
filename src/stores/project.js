import { ipcRenderer as ipc } from 'electron'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log.js'
import { seq, debounce, throttle, log } from '../middleware/index.js'

import {
  activities,
  context,
  edit,
  esper,
  flash,
  history,
  imports,
  intl,
  items,
  keymap,
  lists,
  metadata,
  nav,
  notes,
  notepad,
  ontology,
  panel,
  photos,
  project,
  projectFiles,
  qr,
  recent,
  selections,
  settings,
  sidebar,
  tags,
  transcriptions,
  ui
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
      activities,
      context,
      edit,
      esper,
      flash,
      history,
      imports,
      intl,
      items,
      keymap,
      lists,
      metadata,
      nav,
      notes,
      notepad,
      ontology,
      panel,
      photos,
      project,
      projectFiles,
      qr,
      recent,
      selections,
      settings,
      sidebar,
      tags,
      transcriptions,
      ui
    },
    middleware: (getDefaultMiddleWare) => ([
      ...getDefaultMiddleWare({
        serializableCheck: {
          ignoredActions: [
            'keymap.update'
          ],
          ignoredActionPaths: [
            /^keymap\./, /\.(created|modified)$/
          ],
          ignoredPaths: [
            /^keymap\./, /\.(created|modified)$/, 'project.closed'
          ]
        }
      }),
      debounce,
      throttle,
      seq,
      log,
      saga
    ])
  })

  return { ...store, saga }
}
