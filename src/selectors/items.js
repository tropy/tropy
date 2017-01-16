'use strict'

const {
  createSelector: memo
} = require('reselect')


const getItem = ({ items }, { item }) => items[item]

const getSelectedItems = ({ items, nav }) =>
  nav.items.map(id => items[id])

const getItems = memo(
  ({ items }) => items,
  ({ metadata }) => metadata,
  ({ ui }) => ui.items,

  (items, metadata, ids) =>
    ids.map(id => ({ id, ...items[id], data: metadata[id] || {} }))
)


module.exports = {
  getItem,
  getItems,
  getSelectedItems
}
