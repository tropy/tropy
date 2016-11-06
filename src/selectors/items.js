'use strict'

const {
  createSelector: memo
} = require('reselect')


const getItem = ({ items }, { item }) => items[item]

const getSelectedItem = (state) =>
  state.nav.items.length === 1 ?
    getItem(state, { item: state.nav.items[0] }) : null

const getSelectedItems = ({ items, nav }) =>
  nav.items.map(id => items[id])

const getItems = memo(
  ({ items }) => items,
  ({ ui }) => ui.items,

  (items, ids) =>
    ids.map(id => (items[id] || { id }))
)


module.exports = {
  getItem,
  getItems,
  getSelectedItem,
  getSelectedItems
}
