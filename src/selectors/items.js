'use strict'

const { pluck } = require('../common/util')
const { createSelector: memo } = require('reselect')

const getItem = ({ items }, { id }) => items[id]

const getItems = ({ items }) => items

const getSelectedItems = memo(
  getItems, ({ nav }) => (nav.items), pluck
)

const getVisibleItems = memo(
  getItems, ({ ui }) => (ui.items), pluck
)

module.exports = {
  getItem,
  getItems,
  getSelectedItems,
  getVisibleItems
}
