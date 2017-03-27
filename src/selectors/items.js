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

module.exports = {
  getItems,
  getSelectedItems,
  getVisibleItems
}
