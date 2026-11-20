import { createSelector as memo } from '@reduxjs/toolkit'
import { dc } from '../common/ns.js'
import { sortKey } from '../slices/nav/view.js'
import * as COLUMN from '../slices/columns/builtin.js'

const DEFAULT_SORT = { column: dc.title, asc: true }
const DEFAULT_LIST_SORT = { column: COLUMN.POSITION.id, asc: true }

// The item sort when the user has not chosen one.
export const getDefaultSort = (list) =>
  (list > 0) ? DEFAULT_LIST_SORT : DEFAULT_SORT

export const getSortColumn = memo(
  ({ nav }) => nav.sort,
  ({ nav }) => sortKey(nav.view),
  (sort, list) => ((list in sort) ? sort[list] : getDefaultSort(list))
)
