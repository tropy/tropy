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
    onError(e) {
      fatal({ stack: e.stack }, 'unhandled error in saga middleware')
      ipc.send('error', e)
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
