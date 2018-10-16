'use strict'

const {
  createSelector: memo
} = require('reselect')

function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield* flatten(lists[id].children, lists, expand)
    }
  }
}

const getListSubTree = memo(
  ({ lists }, { root }) => lists[root],
  ({ lists }) => lists,
  ({ sidebar }) => sidebar.expand,
  (root, lists, expand) => [
    ...flatten(root.children, lists, expand)
  ]
)

module.exports = {
  getListSubTree
}
