import { LIST } from '../../constants/index.js'
import { dc } from '../../common/ns.js'
import { restoreId } from '../activities.js'
import * as COLUMN from '../columns/builtin.js'

/*
 * nav.search.view { name, ...props }
 *
 * The view decides the base set of visible items;
 * search query and tags are secondary filters.
 */

export const project = () => ({ name: 'project' })
export const list = (id) => ({ name: 'list', id })
export const unlisted = () => ({ name: 'unlisted' })
export const trash = () => ({ name: 'trash' })
export const activity = (type, id) => ({ name: 'activity', type, id })

export const listOf = (view) =>
  (view?.name === 'list') ? view.id : null

export const sortKey = (view) =>
  listOf(view) ?? LIST.ROOT

const DEFAULT_SORT = { column: dc.title, asc: true }
const DEFAULT_LIST_SORT = { column: COLUMN.POSITION.id, asc: true }

export const defaultSort = (key) =>
  (key > 0) ? DEFAULT_LIST_SORT : DEFAULT_SORT

export const isList = (view, id) =>
  view?.name === 'list' && view.id === id

export const isActivity = (view, type, id) => {
  if (view?.name !== 'activity')
    return false
  if (view.type !== type)
    return false
  else
    return (view.id == null || view.id === id)
}

// Ids may be null or missing (e.g. a past activity, restored or not).
const isSame = (a, b) =>
  a.name === b.name && a.type === b.type && (a.id ?? null) === (b.id ?? null)

// View containment rules:
// The project contains everything, except the trash;
// deleted items belong to no other view!
export const contains = (outer, inner) => {
  if (isSame(outer, inner))
    return true

  return outer.name === 'project' && (
    inner.name === 'list' ||
    inner.name === 'unlisted' ||
    inner.name === 'activity'
  )
}

export function restore (view) {
  switch (view?.name) {
    case 'activity':
      return activity(view.type, restoreId(view.id))
    case 'list':
    case 'unlisted':
    case 'trash':
    case 'project':
      return view
    default:
      return project()
  }
}
