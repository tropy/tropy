'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')
const {
  cat, compose, filter, keep, map, transduce, transformer
} = require('transducers.js')


const collect = transformer((acc, [uri, value]) => {
  if (acc.data.hasOwnProperty(uri)) {
    if (acc.data[uri].text === value.text) {
      acc.stats[uri]++
    }

  } else {
    acc.data[uri] = value
    acc.stats[uri] = 1
  }

  return acc
})

const skipId = filter(kv => kv[0] !== 'id')

const getMetadata = ({ metadata }) => metadata

const getSelectedMetadata = memo(
  getMetadata,
  ({ nav }) => (nav.items),

  (metadata, ids) =>
    transduce(
      ids,
      compose(map(id => metadata[id]), keep(), cat, skipId),
      collect,
      { data: { id: ids }, stats: {} })
)

const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

module.exports = {
  getSelectedMetadata,
  getVisibleMetadata
}
