import { ipcRenderer as ipc } from 'electron'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log.js'
import { seq, debounce, throttle, log } from '../middleware/index.js'

import activities from '../slices/activities.js'
import columns from '../slices/columns/index.js'
import nav from '../slices/nav/index.js'
import notepad from '../slices/notepad.js'
import projectFiles from '../slices/project-files.js'
import qr from '../slices/qr.js'
import transcriptions from '../slices/transcriptions.js'

import {
  context,
  edit,
  esper,
  flash,
  history,
  intl,
  items,
  keymap,
  lists,
  metadata,
  notes,
  ontology,
  panel,
  photos,
  project,
  recent,
  selections,
  settings,
  sidebar,
  tags,
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
      columns,
      context,
      edit,
      esper,
      flash,
      history,
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
