import fs from 'node:fs'
import React from 'react'
import * as chai from 'chai'
import chaiDom from 'chai-dom'
import { render as testRender, queries } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import { DndProvider } from 'react-dnd'
import { TestBackend } from 'react-dnd-test-backend'
import ARGS from '#internal/args.js'
import win, { createWindowInstance } from '#internal/window.js'
import { WindowContext } from '#internal/components/window.js'
import { Strings } from '#internal/res.js'
import * as reducer from '#internal/reducers/index.js'

chai.use(chaiDom)

const helpers = {
  $(node, ...args) {
    return node.querySelector(...args)
  },

  $$(node, ...args) {
    return node.querySelectorAll(...args)
  },

  element(node) {
    return node.firstChild
  }
}

let messages = new Strings(
  Strings.parse(fs.readFileSync(Strings.expand('renderer')))
).flatten()

let store = configureStore({
  reducer
})

export const inWindowContext = {
  wrapper({ children }) {
    return (
      <WindowContext.Provider value={win || createWindowInstance(ARGS)}>
        <DndProvider backend={TestBackend}>
          <Provider store={store}>
            <IntlProvider locale="en" messages={messages}>
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
