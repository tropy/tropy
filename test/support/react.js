'use strict'

if (process.type !== 'renderer')
  throw new Error('not in renderer')

const React = require('react')

const chai = require('chai')
chai.use(require('chai-dom'))

const testing = require('@testing-library/react')

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

const inWindowContext = {
  // eslint-disable-next-line react/prop-types
  wrapper({ children }) {
    const { IntlProvider } = require('react-intl')
    const { DndProvider } = require('react-dnd-cjs')
    const { default: TestBackend } = require('react-dnd-test-backend-cjs')
    const { WindowContext } = __require('components/main')
    const ARGS = __require('args').default
    const win = __require('window')

    return (
      <WindowContext.Provider value={win.default || new win.Window(ARGS)}>
        <IntlProvider locale="en">
          <DndProvider backend={TestBackend}>
            {children}
          </DndProvider>
        </IntlProvider>
      </WindowContext.Provider>
    )
  }
}

const render = (ui, opts) => {
  const container = document.createElement('main')
  document.body.appendChild(container)

  return testing.render(ui, {
    container,
    queries: {
      ...testing.queries,
      ...helpers
    },
    ...opts
  })
}

module.exports = {
  render,
  inWindowContext
}
