if (process.type !== 'renderer')
  throw new Error('not in renderer')

import React from 'react'
import chai from 'chai'
import dom from 'chai-dom'
import { render as testRender, queries } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { DndProvider } from 'react-dnd-cjs'
import TestBackend from 'react-dnd-test-backend-cjs'
import { WindowContext } from '../../src/components/main'
import ARGS from '../../src/args'
import win, { Window } from '../../src/window'

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

export const inWindowContext = {
  // eslint-disable-next-line react/prop-types
  wrapper({ children }) {
    return (
      <WindowContext.Provider value={win || new Window(ARGS)}>
        <IntlProvider locale="en">
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
