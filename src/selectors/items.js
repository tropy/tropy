'use strict'

const values = require('object.values')

const {
  createSelector: memo
} = require('reselect')


const getItems = memo(
  ({ items }) => items,

  (items) =>
    values(items)
)


module.exports = {
  getItems
}

