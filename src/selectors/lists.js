import { createSelector as memo } from 'reselect'
import { get, encodeListPath } from '../common/util.js'
import { LIST } from '../constants/index.js'

export const getListTree = ({ lists }, {
  id = LIST.ROOT,
  recursive = true
} = {}) => {

  let ids = (id === LIST.ROOT)
    ? lists[id].children
    : [id]

  return (recursive)
    ? [...flatten(ids, lists, true)]
    : ids
}

export const getListTreePaths = (state, props) =>
  getListTree(state, props)
    .map(id => getListPath(state, { id }))

function *flatten (children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand === true || expand[id]) {
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
  while (id && id !== LIST.ROOT) {
    let { name, parent } = lists[id]
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
