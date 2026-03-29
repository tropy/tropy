import fs from 'node:fs'
import { render as testRender, queries } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import { DndProvider } from 'react-dnd'
import { TestBackend } from 'react-dnd-test-backend'
import WIN, { createWindowInstance } from '#tropy/window.js'
import { WindowContext } from '#tropy/components/window.js'
import { Strings } from '#tropy/res.js'
import * as reducer from '#tropy/reducers/index.js'

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

let messages = new Strings(
  Strings.parse(fs.readFileSync(Strings.expand('renderer')))
).flatten()

let store = configureStore({
  reducer
})

function onIntlError (error) {
  switch (error.code) {
    case 'MISSING_TRANSLATION':
      break
    default:
      console.error(error.code, error.message)
  }
}

export const inWindowContext = {
  wrapper ({ children }) {
    return (
      <WindowContext.Provider value={win}>
        <DndProvider backend={TestBackend}>
          <Provider store={store}>
            <IntlProvider
              locale="en"
              messages={messages}
              onError={onIntlError}>
              {children}
            </IntlProvider>
          </Provider>
        </DndProvider>
      </WindowContext.Provider>
    )
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
