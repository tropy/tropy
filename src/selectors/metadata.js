'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')
const { equal } = require('../value')
const {
  cat, compose, filter, keep, map, seq, transduce, transformer
} = require('transducers.js')


const collect = transformer((data, [key, value]) => {
  if (value != null) {
    if (data.hasOwnProperty(key)) {
      if (equal(data[key], value)) data[key].count++

    } else {
      data[key] = { ...value, count: 1 }
    }
  }

  return data
})

const skipId = filter(kv => kv[0] !== 'id')

const getMetadata = ({ metadata }) => metadata

const getItemMetadata = memo(
  getMetadata,
  ({ nav }) => (nav.items),

  (metadata, items) =>
    seq(
      transduce(
        items,
        compose(map(id => metadata[id]), keep(), cat, skipId),
        collect,
        { id: items }),
      map(([key, value]) => {
        if (key !== 'id') {
          value.mixed = value.count !== items.length
        }

        return [key, value]
      }))
)

const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)


module.exports = {
  getItemMetadata,
  getVisibleMetadata
}
