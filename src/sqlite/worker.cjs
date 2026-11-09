'use strict'

const { Handler } = require('./handler.js')

const dbc = new Handler()

self.onmessage = ({ data: { id, op, ...message } }) => {
  try {
    let { value, changed } = dbc.handle(op, message, (batch) => {
      self.postMessage({ id, batch })
    })

    self.postMessage({ id, value, changed },
      ArrayBuffer.isView(value) ? [value.buffer] : [])

  } catch ({ name, message: text, code, stack, changed }) {
    self.postMessage({
      id,
      error: {
        name,
        message: text,
        code,
        stack,
        changed
      }
    })
  }
}
