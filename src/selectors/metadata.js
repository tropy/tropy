'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')
const { equal } = require('../value')
const {
  cat, compose, filter, keep, map, seq, transduce, transformer
} = require('transducers.js')


const collect = transformer((data, [uri, value]) => {
  if (value != null) {
    if (data.hasOwnProperty(uri)) {
      if (equal(data[uri], value)) data[uri].count++

    } else {
      data[uri] = { ...value, count: 1 }
    }
  }

  return data
})

const skipId = filter(kv => kv[0] !== 'id')

const getMetadata = ({ metadata }) => metadata

const getSelectedMetadata = memo(
  getMetadata,
  ({ nav }) => (nav.items),

  (metadata, ids) =>
    seq(
      transduce(
        ids,
        compose(map(id => metadata[id]), keep(), cat, skipId),
        collect,
        { id: ids }),
      map(([uri, value]) => {
        if (uri !== 'id') {
          value.mixed = value.count !== ids.length
        }

        return [uri, value]
      }))
)

const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

module.exports = {
  getSelectedMetadata,
  getVisibleMetadata
}
