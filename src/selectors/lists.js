import { createSelector as memo } from 'reselect'
import { get } from '../common/util.js'

function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield * flatten(lists[id].children, lists, expand)
    }
  }
}

export const findList = (lists, name, parent) => {
  let parentList = lists[parent]
  if (!parentList) return null
  for (let id of parentList.children) {
    if (lists[id]?.name === name)
      return lists[id]
  }
  return null
}

export const getListSubTree = memo(
  ({ lists }, { root }) => get(lists, [root, 'children']),
  ({ lists }) => lists,
  ({ sidebar }) => sidebar.expand,
  (children, lists, expand) => [
    ...flatten(children || [], lists, expand)
  ]
)
