import fs from 'node:fs'
import { render as testRender, queries } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import WIN, { createWindowInstance } from '#tropy/window.js'
import { WindowContext } from '#tropy/components/window.js'
import { Strings } from '#tropy/res.js'
import * as legacy from '#tropy/reducers/index.js'
import activities from '#tropy/slices/activities.js'
import columns from '#tropy/slices/columns/index.js'
import nav from '#tropy/slices/nav/index.js'
import notepad from '#tropy/slices/notepad.js'
import prefs from '#tropy/slices/prefs.js'
import projectFiles from '#tropy/slices/project-files.js'
import qr from '#tropy/slices/qr.js'
import transcriptions from '#tropy/slices/transcriptions.js'

const reducer = {
  ...legacy,
  activities,
  columns,
  nav,
  notepad,
  prefs,
  projectFiles,
  qr,
  transcriptions
}

const helpers = {
  $ (node, ...args) {
    return node.querySelector(...args)
  },

  $$ (node, ...args) {
    return node.querySelectorAll(...args)
  },

  element (node) {
    return node.firstChild
  }
}

let win = WIN || createWindowInstance()

export const messages = new Strings(
  Strings.parse(fs.readFileSync(Strings.expand('renderer')))
).flatten()

let store = createStore()

function onIntlError (error) {
  switch (error.code) {
    case 'MISSING_TRANSLATION':
      break
    default:
      console.error(error.code, error.message)
  }
}

export function createStore (preloadedState) {
  return configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [/^keymap\./]
      }
    })
  })
}

export const inWindowContext = withStore(store)

export function withStore (store) {
  return {
    wrapper ({ children }) {
      return (
        <WindowContext.Provider value={win}>
          <Provider store={store}>
            <IntlProvider
              locale="en"
              messages={messages}
              onError={onIntlError}>
              {children}
            </IntlProvider>
          </Provider>
        </WindowContext.Provider>
      )
    }
  }
}

export const render = (ui, opts) => {
  const container = document.createElement('main')
  document.body.appendChild(container)

  return testRender(ui, {
    container,
    queries: {
      ...queries,
      ...helpers
    },
    ...opts
  })
}
