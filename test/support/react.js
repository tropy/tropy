import fs from 'node:fs'
import React from 'react'
import chai from 'chai'
import dom from 'chai-dom'
import { render as testRender, queries } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { DndProvider } from 'react-dnd'
import { TestBackend } from 'react-dnd-test-backend'
import ARGS from '../../src/args.js'
import win, { createWindowInstance } from '../../src/window.js'
import { WindowContext } from '../../src/components/window.js'
import { Strings } from '../../src/res.js'

chai.use(dom)

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

export const inWindowContext = {
  // eslint-disable-next-line react/prop-types
  wrapper({ children }) {
    return (
      <WindowContext.Provider value={win || createWindowInstance(ARGS)}>
        <IntlProvider locale="en" messages={messages}>
          <DndProvider backend={TestBackend}>
            {children}
          </DndProvider>
        </IntlProvider>
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
