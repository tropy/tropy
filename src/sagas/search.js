import { actionChannel, call, put, select, take } from 'redux-saga/effects'
import { buffers } from 'redux-saga'
import { warn } from '../common/log.js'
import { build, update } from '../common/order.js'
import { createSequence, stable } from '../common/sequence.js'
import { collator } from '../collate.js'
import { NAV } from '../constants/index.js'
import { getSortColumn } from '../selectors/index.js'
import { selectSortKey } from '../slices/qr.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'

const getSort = (state) => ({
  ...getSortColumn(state),
  locale: state.intl.locale
})

const isSameSort = (a, b) =>
  a != null && b != null &&
  a.column === b.column && a.asc === b.asc && a.locale === b.locale

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

const getData = ({ items, metadata, ontology }) => ({
  items, metadata, template: ontology.template
})

// Keeps qr.matches (and qr.items) up to date with the search in state,
// after each action that asks for it, one search at a time:
// actions taken while a search is busy leave one in the buffer,
// so the next search catches up with all of them.
export function *matches (db, pattern) {
  let chan = yield actionChannel(pattern, buffers.sliding(1))

  try {
    while (true) {
      yield take(chan)
      yield call(search, db)
    }
  } finally {
    chan.close()
  }
}

export function *search (db) {
  try {
    let { nav, imports, sort } = yield select(state => ({
      nav: state.nav,
      imports: state.imports,
      sort: getSortColumn(state)
    }))

    var { list, tags, trash, query } = nav

    let START = Date.now()

    let result

    switch (true) {
      case (nav.imports && imports.length > 0): {
        let ids = imports[0].items
        result = yield call(mod.item.find, db, { ids, query, sort })
        break
      }
      case (trash):
        result = yield call(mod.item.trash, db, { sort, query })
        break

      case (list != null):
        if (list < 0)
          result = yield call(mod.item.unlisted, db, { tags, query, sort })
        else
          result = yield call(mod.item.list, db, list, { tags, query, sort })
        break

      default:
        result = yield call(mod.item.all, db, { tags, sort, query })
    }

    let ms = Date.now() - START
    if (ms > 300) {
      warn({
        ms,
        list,
        query,
        tags: tags.length > 0,
        trash
      }, `SLOW: *search query "${query}" took ${ms}ms`)
    }

    let { qr, current } = yield select(state => ({
      qr: state.qr,
      current: getSort(state)
    }))

    // The same results (e.g. after an edit) keep their identity.
    let matches = qr.matches

    if (!isSameSet(result.items, matches)) {
      matches = {}
      for (let id of result.items) matches[id] = true
    }

    // The order saga owns qr.order:
    // if it has not caught up with the sort yet,
    // it writes the items once it has.
    // Otherwise the items only change with the matches.
    if (isPosition(current))
      yield* commit({ matches, items: result.items })
    else if (isSameSort(qr.sort, current) && matches !== qr.matches)
      yield* commit({ matches, items: filter(qr.order, matches) })
    else
      yield* commit({ matches })

  } catch (err) {
    warn({
      err,
      list,
      query,
      tags: tags?.length > 0,
      trash
    }, '*search failed')
  }
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

    let options = {
      asc: sort.asc,
      compare: isDate(sort) ? undefined : collator(sort.locale).compare
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
    let missing = []

    for (let id in data.items) {
      id = Number(id)

      if (!keys.has(id)) {
        keys.set(id, key(id))
        missing.push(id)
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
