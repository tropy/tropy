'use strict'

const {
  createSelector: memo
} = require('reselect')

const getChildren = () =>
  memo(
    ({ lists }) => lists,
    (_, { parent }) => parent,

    (lists, parent) =>
      lists[parent] ?
        lists[parent].children.map(id => lists[id]) : []
  )


module.exports = {
  getChildren
}
