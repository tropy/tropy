'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')

const getItems = ({ items }) => items

const getSelectedItems = memo(
  ({ items }) => items, ({ nav }) => (nav.items), pluck
)

const getVisibleItems = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

const getListHold = memo(
  getSelectedItems,
  (items) => items.reduce((hold, item) => {
    for (let list of item.lists) hold[list] = true
    return hold
  }, {})
)
module.exports = {
  getItems,
  getListHold,
  getSelectedItems,
  getVisibleItems
}
