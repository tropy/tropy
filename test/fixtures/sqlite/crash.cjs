'use strict'

require('../../../src/sqlite/worker.cjs')

const { onmessage } = self

self.onmessage = (event) => {
  if (event.data.sql?.includes('-- crash'))
    throw new Error('DB worker crashed')

  onmessage(event)
}
