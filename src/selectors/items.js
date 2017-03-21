'use strict'

const { createSelector: memo } = require('reselect')
const { seq, keep, compose, map, filter } = require('transducers.js')

const isNotPending = (item) => !item.pending
const getItems = ({ items }) => items

const pluck = (items, ids) =>
  seq(ids, compose(
    map(id => items[id]),
    keep(),
    filter(isNotPending)
  ))

const getSelectedItems = memo(
  ({ items }) => items, ({ nav }) => (nav.items), pluck
)

const getVisibleItems = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

module.exports = {
  getItems,
  getSelectedItems,
  getVisibleItems
}
