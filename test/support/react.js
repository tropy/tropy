'use strict'

if (process.type !== 'renderer')
  throw new Error('not in renderer')

const chai = require('chai')
const { queries, render } = require('@testing-library/react')

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

exports.render = (ui, opts) => {
  const container = document.createElement('main')
  document.body.appendChild(container)

  return render(ui, {
    container,
    queries: {
      ...queries,
      ...helpers
    },
    ...opts
  })
}

chai.use(require('chai-dom'))
