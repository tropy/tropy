import { createSelector as memo } from 'reselect'
import { get, encodeListPath } from '../common/util.js'
import { ROOT } from '../../constants/list.js'


function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield * flatten(lists[id].children, lists, expand)
    }
  }
}

export const getListByName = ({ lists }, { name, parent = ROOT }) => {
  let parentList = lists[parent]
  if (!parentList) return null
  for (let id of parentList.children) {
    if (lists[id]?.name === name)
      return lists[id]
  }
  return null
}

export const getListPath = (state, { id }) => {
  let output = []
  while (id > 0) {
    const { name, parent } = get(state, ['ids', id])
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
