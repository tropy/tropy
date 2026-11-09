import { actionChannel, all, call, put, select, take } from 'redux-saga/effects'
import { buffers } from 'redux-saga'
import { warn } from '../common/log.js'
import { build, reverse, update } from '../common/order.js'
import { createSequence, stable } from '../common/sequence.js'
import { collator } from '../collate.js'
import { parse } from '../common/search.js'
import { NAV } from '../constants/index.js'
import { getSortColumn, getVisiblePhotos } from '../selectors/index.js'
import {
  selectMatchFilter,
  selectQuery,
  selectSortKey,
  selectSubjects
} from '../slices/qr.js'
import { TermCache, contributors, keyOf, membership } from '../common/matches.js'
import { ids as selected } from '../common/selection.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'

const getSort = (state) => ({
  ...getSortColumn(state),
  locale: state.intl.locale
})

const isSameSort = (a, b) =>
  a != null && b != null &&
  a.column === b.column && a.asc === b.asc && a.locale === b.locale

const isReverse = (a, b) =>
  a != null && b != null &&
  a.column === b.column && a.asc !== b.asc && a.locale === b.locale

const isPosition = (sort) =>
  sort.column === NAV.COLUMN.POSITION.id

const isDate = (sort) =>
  sort.column === NAV.COLUMN.CREATED.id ||
  sort.column === NAV.COLUMN.MODIFIED.id

// Returns the ids of order in matches, as an indexed sequence.
const filter = (order, matches) => {
  let [seq, push] = createSequence()

  for (let i = 0; i < order.length; ++i)
    if (matches[order[i]]) push(order[i])

  return seq
}

// Returns ids in list order (from find) by position,
// as an indexed sequence: reversed when descending.
const byPosition = (ids, sort) => {
  let [seq, push] = createSequence()

  if (sort.asc)
    for (let i = 0; i < ids.length; ++i) push(ids[i])
  else
    for (let i = ids.length - 1; i >= 0; --i) push(ids[i])

  return seq
}

// Whether an item belongs to a view, regardless of its query and
// tags: in its list (or in none, for unlisted), in the trash or not.
const belongs = (item, { list, trash, imports }) => {
  if (item == null) return false
  if (imports != null) return imports.includes(item.id)
  if (trash) return !!item.deleted
  if (item.deleted) return false
  if (list == null) return true
  return (list < 0) ? item.lists.length === 0 : item.lists.includes(list)
}

// The selected items that belong to the view (see belongs).
const getSelectedIds = (view) => (state) =>
  selected(state.nav.item).filter(id => belongs(state.items[id], view))

// The ids with those of extra appended that are not among them.
const include = (ids, extra) => {
  if (extra.length === 0)
    return ids

  let has = (extra.length <= 8) ?
    (id => ids.includes(id)) :
    (set => id => set.has(id))(new Set(ids))

  let missing = extra.filter(id => !has(id))

  return (missing.length === 0) ? ids : [...ids, ...missing]
}

const isSameSet = (ids, matches) => {
  if (matches == null)
    return false

  let size = 0
  for (let id in matches) if (matches[id]) ++size

  if (size !== ids.length)
    return false

  for (let i = 0; i < ids.length; ++i)
    if (!matches[ids[i]]) return false

  return true
}

// The term lists of each database (see common/matches.js).
const caches = new WeakMap()

const cacheOf = (db) => {
  let cache = caches.get(db)

  if (cache == null) {
    cache = new TermCache()
    caches.set(db, cache)
  }

  return cache
}

// The term lists, if all of them are cached; otherwise null.
// Synchronous: the caller can update state in the same dispatch.
export function cachedLists (db, terms) {
  let cache = cacheOf(db)
  let lists = []

  for (let term of terms) {
    let entry = cache.get(keyOf(term), db.generation)
    if (entry == null) return null
    lists.push(entry)
  }

  return lists
}

// The subjects and notes matching each term, from the cache
// or queried (in parallel, on the pool's connections).
// Tags are all tags (state.tags), for matching tag names.
export async function termLists (db, terms, tags) {
  let cache = cacheOf(db)

  // Taken before querying: a write meanwhile invalidates the result.
  let generation = db.generation

  return Promise.all(terms.map(async (term) => {
    let key = keyOf(term)
    let lists = cache.get(key, generation)

    if (lists == null) {
      lists = await mod.item.term(db, term, tags)
      cache.set(key, generation, lists)
    }

    return lists
  }))
}

const getOptions = (sort) => ({
  asc: sort.asc,
  compare: isDate(sort) ? undefined : collator(sort.locale).compare
})

const getData = ({ items, metadata, ontology }) => ({
  items, metadata, template: ontology.template
})

const isDone = (cmd) => ({ type, meta }) =>
  type === cmd.type && meta?.done && meta.rel === cmd.meta.seq

// Keeps qr.matches (and qr.items) up to date with the search in state,
// after each action that asks for it, one search (qr.search) at a time:
// actions taken while a search is busy leave one in the buffer,
// so the next search catches up with all of them.
export function *matches (pattern) {
  let chan = yield actionChannel(pattern, buffers.sliding(1))

  try {
    while (true) {
      yield take(chan)

      let cmd = act.qr.search()
      yield put(cmd)
      yield take(isDone(cmd))
    }
  } finally {
    chan.close()
  }
}

// The view the user is looking at: the items the search returns.
const getView = (state) => ({
  list: state.nav.list,
  tags: state.nav.tags,
  trash: state.nav.trash,
  query: state.nav.query,
  imports: (state.nav.imports && state.imports.length > 0) ?
    state.imports[0].items : null
})

// Returns the ids of the items in a view matching the query, as a set
// (in list order, ascending position, for lists).
export function *find (db, { list, tags = [], trash, imports, query }) {
  let START = Date.now()
  let view

  switch (true) {
    case (imports != null):
      view = call(mod.item.find, db, { ids: imports })
      break

    case (!!trash):
      view = call(mod.item.trash, db)
      break

    case (list != null):
      if (list < 0)
        view = call(mod.item.unlisted, db, { tags })
      else
        view = call(mod.item.list, db, list, { tags })
      break

    default:
      view = call(mod.item.all, db, { tags })
  }

  // The view and the terms run in parallel (on separate connections).
  let { terms } = parse(query || '')
  let allTags = yield select(state => state.tags)
  let [result, lists] = yield all([
    view,
    call(termLists, db, terms, allTags)
  ])

  let ids = result.items

  if (lists.length > 0) {
    let subjects = yield select(selectSubjects)
    ids = membership(ids, lists, subjects)
  }

  let ms = Date.now() - START
  if (ms > 300) {
    warn({
      ms,
      list,
      query: !!query,
      tags: tags.length > 0,
      trash
    }, 'slow search')
  }

  return { ids }
}

// Returns ids in the given sort (column, asc and locale):
// from qr.order if it is the UI's sort, otherwise seeded and built.
export function *ordered (db, ids, sort) {
  if (isPosition(sort))
    return byPosition(ids, sort)

  let qr = yield select(state => state.qr)
  let set = {}
  for (let id of ids) set[id] = true

  if (isSameSort(qr.sort, sort))
    return filter(qr.order, set)

  if (isReverse(qr.sort, sort)) {
    let key = yield select(selectSortKey, sort.column)
    return filter(reverse(qr.order, key), set)
  }

  let seed = yield call(mod.item.seed, db, sort)
  let key = yield select(selectSortKey, sort.column)
  let options = getOptions(sort)
  let pre = []

  for (let id of seed) {
    if (set[id]) {
      pre.push(id)
      delete set[id]
    }
  }

  // Items the seed missed (created meanwhile).
  let missing = Object.keys(set).map(Number)

  return update(build(pre, key, options), { changed: missing }, key, options)
}

// Updates the current results in qr (matches and items)
// for the view the user is looking at.
export function *search (db) {
  try {
    // Invalid queries do not search: the results stay.
    if ((yield select(selectQuery)).errors.length > 0)
      return

    var view = yield select(getView)
    let { ids } = yield* find(db, view)

    // The selection counts as matches if it belongs to the view: a
    // search that may narrow the results clears it (nav.js), so it
    // adds nothing, while updates of the results (edits, imports) and
    // widening searches never remove what is selected. Unmatched items
    // drop out with the first update after deselecting.
    ids = include(ids, yield select(getSelectedIds(view)))

    let { qr, current } = yield select(state => ({
      qr: state.qr,
      current: getSort(state)
    }))

    // The same results (e.g. after an edit) keep their identity.
    let matches = qr.matches

    if (!isSameSet(ids, matches)) {
      matches = {}
      for (let id of ids) matches[id] = true
    }

    // The order saga owns qr.order:
    // if it has not caught up with the sort yet,
    // it writes the items once it has.
    // Otherwise the items only change with the matches.
    if (isPosition(current))
      yield* commit({ matches, items: byPosition(ids, current) })
    else if (isSameSort(qr.sort, current) && matches !== qr.matches)
      yield* commit({ matches, items: filter(qr.order, matches) })
    else
      yield* commit({ matches })

  } catch (err) {
    warn({
      err,
      list: view?.list,
      query: view?.query,
      tags: view?.tags?.length > 0,
      trash: view?.trash
    }, '*search failed')
  }
}

// Keeps qr.contributors up to date with the selected items and the
// query, after each action that changes either. A snapshot: edits
// leave it as it is until the next selection or query change (the
// visibility rule, selection.md), so rows do not vanish while edited.
// Actions taken while a run is busy leave one in the buffer.
export function *contributing (db, prev = {}) {
  let chan = yield actionChannel('*', buffers.sliding(1))

  try {
    while (true) {
      yield take(chan)
      prev = yield call(contribute, db, prev)
    }
  } finally {
    chan.close()
  }
}

const isSameIds = (a, b) => {
  if (a == null || b == null || a.length !== b.length)
    return false

  let set = new Set(a)
  return b.every(id => set.has(id))
}

const lookup = (ids) => {
  let obj = {}
  for (let id of ids) obj[id] = true
  return obj
}

// Computes the contributors of the selected items, from the cached
// term lists (see termLists), if the selection or the query changed.
// Returns what it saw, for the next run to compare.
export function *contribute (db, prev = {}) {
  try {
    let { query, item } = yield select(state => state.nav)

    if (query === prev.query && item === prev.item)
      return prev

    // Cursor moves change the selection state, not the items.
    let items = selected(item)

    if (query === prev.query && isSameIds(items, prev.items))
      return { ...prev, item }

    let { terms, errors } = yield select(selectQuery)

    // Invalid queries do not search: the contributors stay too.
    if (errors.length > 0)
      return { query, item, items }

    let value = null

    if (terms.length > 0 && items.length > 0) {
      // Cached after the search: in the same dispatch as the
      // selection, so the filter never shows the previous one.
      let lists = (yield call(cachedLists, db, terms)) ??
        (yield call(termLists, db, terms, yield select(state => state.tags)))
      let subjects = yield select(selectSubjects)
      let { photos, notes } = contributors(items, lists, subjects)

      value = { photos: lookup(photos), notes: lookup(notes) }
    }

    if (value !== null || (yield select(state => state.qr.contributors)) !== null)
      yield put(act.qr.update({ contributors: value }))

    // A new snapshot: the current photo and note may now be hidden.
    yield call(narrow)

    return { query, item, items }

  } catch (err) {
    warn({ err }, '*contribute failed')
    return {}
  }
}

// With the match filter on, after a new snapshot of the contributors,
// the current photo and note fall back to the first contributing ones
// (e.g. selecting an item selects its first photo, which may not
// match). The item selection stays. Only then: in between, what is
// selected stays visible (a note created and selected, or edited so
// it no longer matches; see getVisiblePhotos, getVisibleNotes).
export function *narrow () {
  let { nav, filter } = yield select(state => ({
    nav: state.nav,
    filter: selectMatchFilter(state)
  }))

  if (filter == null) return

  let photo = nav.photo
  let selection = nav.selection

  if (photo != null && !filter.photos[photo]) {
    photo = (yield select(getVisiblePhotos))
      .find(p => filter.photos[p.id])?.id ?? null
    selection = null
  }

  let note = nav.note

  if (photo !== nav.photo || (note != null && !filter.notes[note])) {
    let notes = (yield select(state =>
      (state.selections[selection] ?? state.photos[photo])?.notes)) ?? []
    note = notes.find(id => filter.notes[id]) ?? null
  }

  if (photo !== nav.photo || note !== nav.note)
    yield put(act.nav.update({ photo, selection, note }))
}

// Keeps qr.order in sync with the sort and the sort keys in state,
// after each action, starting from the cache of a first sync.
// Each run compares state with the previous run's:
// actions taken while a run is busy leave one in the buffer,
// so the next run catches up with all of them.
export function *order (db, cache = {}) {
  let chan = yield actionChannel('*', buffers.sliding(1))

  try {
    while (true) {
      yield take(chan)
      cache = yield call(sync, db, cache)
    }
  } finally {
    chan.close()
  }
}

// Brings qr.order up to date and returns the cache for the next run:
// the sort, the state the keys came from, the keys and the order.
// Returns {} on failure, so the next run starts over.
export function *sync (db, prev = {}) {
  try {
    let sort = yield select(getSort)

    if (isPosition(sort)) {
      if (!isSameSort(prev.sort, sort))
        yield* commit({ order: [], sort })

      return { sort }
    }

    let options = getOptions(sort)

    if (isReverse(prev.sort, sort) && prev.order != null) {
      let order = reverse(prev.order, (id) => prev.keys.get(id))
      yield* write(order, sort)
      prev = { ...prev, sort, order }
    }

    if (isSameSort(prev.sort, sort)) {
      let data = yield select(getData)

      if (data.items === prev.data.items &&
        data.metadata === prev.data.metadata &&
        data.template === prev.data.template)
        return prev

      let key = yield select(selectSortKey, sort.column)
      let { keys } = prev
      let changed = []
      let removed = []

      // Edits replace the state of the items they change,
      // so only those need their keys recomputed.
      let all = (data.template !== prev.data.template)

      for (let id in data.items) {
        if (!all &&
          data.items[id] === prev.data.items[id] &&
          data.metadata[id] === prev.data.metadata[id])
          continue

        id = Number(id)
        let k = key(id)

        if (!keys.has(id) || !Object.is(keys.get(id), k)) {
          keys.set(id, k)
          changed.push(id)
        }
      }

      for (let id of keys.keys())
        if (!(id in data.items)) removed.push(id)

      for (let id of removed)
        keys.delete(id)

      // Many changes (e.g. when the project loads): rebuild instead.
      if (changed.length + removed.length <= prev.order.length / 8) {
        let order = update(prev.order, { changed, removed }, key, options)

        if (order !== prev.order)
          yield* write(order, sort)

        return { ...prev, data, order }
      }
    }

    // Seeded from the database, so that sorting is fast.
    let seed = yield call(mod.item.seed, db, sort)

    // The sort changed while the seed was loading:
    // the next run starts over.
    if (!isSameSort(sort, yield select(getSort)))
      return {}

    let data = yield select(getData)
    let key = yield select(selectSortKey, sort.column)
    let keys = new Map()

    // Items deleted while the seed was loading.
    let ids = []
    for (let id of seed) if (id in data.items) ids.push(id)

    let order = build(ids, (id) => {
      let k = key(id)
      keys.set(id, k)
      return k
    }, options)

    // Items created while the seed was loading.
    // Every key is an item's, so equal counts mean none are missing.
    let missing = []

    if (keys.size !== Object.keys(data.items).length) {
      for (let id in data.items) {
        id = Number(id)

        if (!keys.has(id)) {
          keys.set(id, key(id))
          missing.push(id)
        }
      }
    }

    order = update(order, { changed: missing }, key, options)

    yield* write(order, sort)

    return { sort, data, keys, order }
  } catch (err) {
    warn({ err }, '*order failed')
    return {}
  }
}

function *write (order, sort) {
  let { matches } = yield select(state => state.qr)

  yield* commit((matches == null) ?
    { order, sort } :
    { order, sort, items: filter(order, matches) })
}

// Writes only what changed, or nothing:
// results that stay the same keep their identity in state,
// so that nothing downstream sees a new sequence.
function *commit ({ matches, order, items, sort }) {
  let qr = yield select(state => state.qr)
  let payload = {}

  if (matches != null && matches !== qr.matches)
    payload.matches = matches
  if (order != null && stable(order, qr.order) !== qr.order)
    payload.order = order
  if (items != null && stable(items, qr.items) !== qr.items)
    payload.items = items
  if (sort != null && !isSameSort(sort, qr.sort))
    payload.sort = sort

  if (Object.keys(payload).length > 0)
    yield put(act.qr.update(payload))
}
