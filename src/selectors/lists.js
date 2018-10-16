'use strict'

const { get } = require('../common/util')
const { createSelector: memo } = require('reselect')

function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield* flatten(lists[id].children, lists, expand)
    }
  }
}

const getListSubTree = memo(
  ({ lists }, { root }) => get(lists, [root, 'children'], []),
  ({ lists }) => lists,
  ({ sidebar }) => sidebar.expand,
  (children, lists, expand) => [
    ...flatten(children, lists, expand)
  ]
)

module.exports = {
  getListSubTree
}
