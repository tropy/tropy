import { createSelector as memo } from 'reselect'
import { get } from '../common/util'

function *flatten(children, lists, expand) {
  for (let id of children) {
    yield id
    if (expand[id]) {
      yield* flatten(lists[id].children, lists, expand)
    }
  }
}

export const getListSubTree = memo(
  ({ lists }, { root }) => get(lists, [root, 'children'], []),
  ({ lists }) => lists,
  ({ sidebar }) => sidebar.expand,
  (children, lists, expand) => [
    ...flatten(children, lists, expand)
  ]
)
