'use strict'

const {
  createSelector: memo
} = require('reselect')


const collect = (items, metadata, ids) =>
  ids.map(id => ({ id, ...items[id], data: { id, ...metadata[id] } }))


const getItem = ({ items }, { item }) => items[item]

const getSelectedItems = memo(
  ({ items }) => items,
  ({ metadata }) => metadata,
  ({ nav }) => nav.items,
  collect)

const getItems = memo(
  ({ items }) => items,
  ({ metadata }) => metadata,
  ({ ui }) => ui.items,
  collect)


module.exports = {
  getItem,
  getItems,
  getSelectedItems
}
