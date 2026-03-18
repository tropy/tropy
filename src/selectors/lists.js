import { createSelector as memo } from 'reselect'
import { get, encodeListPath } from '../common/util.js'
import { LIST } from '../constants/index.js'

const getLists = ({ lists }) => lists

export const getAllLists = memo(
  getLists,
  (lists) => Object.values(lists)
    .filter(l => l.id > 0)
    .map(l => getListPath({ lists }, l))
    .sort()
)

function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield * flatten(lists[id].children, lists, expand)
    }
  }
}

export const getListByName = ({ lists }, { name, parent = LIST.ROOT }) => {
  let parentList = lists[parent]
  if (!parentList) return null
  for (let id of parentList.children) {
    if (lists[id]?.name === name)
      return lists[id]
  }
  return null
}

export const getListPath = ({ lists }, { id }) => {
  let output = []
  while (id > 0) {
    const { name, parent } = lists[id]
    output.unshift(encodeListPath(name))
    id = parent
  }
  return output.join('/')
}

export const getListSubTree = memo(
  ({ lists }, { root }) => get(lists, [root, 'children']),
  ({ lists }) => lists,
  ({ sidebar }) => sidebar.expand,
  (children, lists, expand) => [
    ...flatten(children || [], lists, expand)
  ]
)
