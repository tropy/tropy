'use strict'

const {
  createSelector: memo
} = require('reselect')


const getItems = memo(
  ({ items }) => items,
  ({ ui }) => ui.items,

  (items, ids) =>
    ids.map(id => (items[id] || { id }))
)


module.exports = {
  getItems
}

