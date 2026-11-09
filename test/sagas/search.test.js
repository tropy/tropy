import { mock } from 'node:test'
import { run } from '../support/saga.js'
import {
  cachedLists,
  contribute,
  narrow,
  search,
  sync,
  termLists
} from '#tropy/sagas/search.js'
import { create } from '#tropy/common/selection.js'
import { update } from '#tropy/slices/qr.js'
import { getDefaultSort } from '#tropy/selectors/nav.js'
import * as mod from '#tropy/models/index.js'

const TITLE = 'http://purl.org/dc/elements/1.1/title'

describe('order saga', () => {
  const title = (id, text) => ({ id, [TITLE]: { text, type: 'text' } })

  // Enough items that one edit is not a rebuild.
  const ids = Array.from({ length: 16 }, (_, i) => i + 1)
  const items = Object.fromEntries(ids.map(id => [id, { id }]))
  const untitled = ids.slice(3)

  const state = (metadata, qr = {}) => ({
    intl: { locale: 'en' },
    nav: { sort: {}, list: null },
    items,
    metadata,
    ontology: { template: {} },
    qr: { matches: { 1: true, 3: true }, ...qr }
  })

  const metadata = {
    1: title(1, 'b'),
    2: title(2, 'c'),
    3: title(3, 'a')
  }

  const sync$ = (s, prev = {}) =>
    run(sync(null, prev), {
      state: s,
      mocks: [[mod.item.seed, () => [3, 1, 2, ...untitled]]]
    })

  const qr = (puts) =>
    puts.filter(action => action.type === update.type)
      .map(({ payload }) => payload)

  it('builds the order and the items from the seed', () => {
    let { puts, calls } = sync$(state(metadata))

    expect(calls(mod.item.seed).callCount()).to.equal(1)
    expect(qr(puts)).to.have.length(1)
    expect(qr(puts)[0].order).to.eql([3, 1, 2, ...untitled])
    expect(qr(puts)[0].items).to.eql([3, 1])
  })

  it('moves edited items without rebuilding', () => {
    let s = state(metadata)
    let { result } = sync$(s)

    let edited = { ...metadata, 3: title(3, 'd') }
    let { puts, calls } = sync$(state(edited, { matches: s.qr.matches }), result)

    expect(calls(mod.item.seed).callCount()).to.equal(0)
    expect(qr(puts)[0].order).to.eql([1, 2, 3, ...untitled])
    expect(qr(puts)[0].items).to.eql([1, 3])
  })

  it('keeps the state when a rebuild finds the same order', () => {
    let s = state(metadata)
    let { puts: [{ payload }] } = sync$(s)

    expect(sync$(state(metadata, payload)).puts).to.eql([])
  })

  it('reverses the order on a direction change without seeding', () => {
    let { result } = sync$(state(metadata))
    let s = state(metadata)
    s.nav.sort = { 0: { ...getDefaultSort(0), asc: false } }

    let { puts, calls } = sync$(s, result)

    expect(calls(mod.item.seed).callCount()).to.equal(0)
    expect(qr(puts)[0].order).to.eql([2, 1, 3, ...untitled.toReversed()])
    expect(qr(puts)[0].sort).to.include({ asc: false })
  })

  it('does nothing when the keys did not change', () => {
    let s = state(metadata)
    let { result } = sync$(s)

    expect(sync$(s, result).puts).to.eql([])
  })

  it('starts over when the sort changed while seeding', () => {
    let s = state(metadata)
    let { puts, result } = run(sync(null), {
      state: s,
      mocks: [[mod.item.seed, () => {
        s.intl = { locale: 'de' }
        return ids
      }]]
    })

    expect(puts).to.eql([])
    expect(result).to.eql({})
  })

  it('drops items deleted while seeding', () => {
    let { puts } = run(sync(null), {
      state: state(metadata),
      mocks: [[mod.item.seed, () => [99, 3, 1, 2, ...untitled]]]
    })

    expect(qr(puts)[0].order).to.eql([3, 1, 2, ...untitled])
  })

  it('adds items created while seeding', () => {
    let { puts } = run(sync(null), {
      state: state(metadata),
      mocks: [[mod.item.seed, () => [3, 1, ...untitled]]]
    })

    expect(qr(puts)[0].order).to.eql([3, 1, 2, ...untitled])
  })
})

describe('search saga', () => {
  const state = (qr, query = '', item = []) => ({
    intl: { locale: 'en' },
    nav: { sort: {}, list: null, tags: [], query, item: create(item) },
    imports: [],
    items: {
      1: { id: 1, photos: [11] },
      2: { id: 2, photos: [] },
      3: { id: 3, photos: [] },
      4: { id: 4, photos: [41] }
    },
    photos: {
      11: { id: 11, item: 1, selections: [] },
      41: { id: 41, item: 4, selections: [] }
    },
    notes: { 7: { id: 7, photo: 11 } },
    qr
  })

  const search$ = (s, ids, lists = []) =>
    run(search(null), {
      state: s,
      mocks: [
        [mod.item.all, () => ({ items: ids })],
        [termLists, () => lists]
      ]
    })

  it('reverses the list order when sorting by position descending', () => {
    let s = {
      ...state({ matches: null }),
      nav: {
        list: 1,
        sort: { 1: { column: 'added', asc: false } },
        tags: [],
        query: '',
        item: create()
      }
    }
    let { puts: [{ payload }] } = run(search(null), {
      state: s,
      mocks: [
        [mod.item.list, () => ({ items: [1, 2, 3] })],
        [termLists, () => []]
      ]
    })

    expect(payload.items).to.eql([3, 2, 1])
  })

  it('keeps the items of the view matching every term', () => {
    // Item 1 by its photo's note, item 3 itself, item 4 by its photo
    // (not in the view); the second term matches items 1 and 3.
    let lists = [
      { subjects: Int32Array.of(3, 41), notes: Int32Array.of(7) },
      { subjects: Int32Array.of(1, 3), notes: Int32Array.of() }
    ]

    let { puts: [{ payload }] } =
      search$(state({ matches: null }, 'x y'), [1, 2, 3], lists)

    expect(payload.matches).to.eql({ 1: true, 3: true })

    // The same matches keep their identity.
    expect(search$(state(payload, 'x y'), [1, 2, 3], lists).puts).to.eql([])
  })

  it('does not search invalid queries', () => {
    let s = state({ matches: null })
    s.nav = {
      ...s.nav,
      query: Array.from({ length: 33 }, (_, i) => `w${i}`).join(' ')
    }

    let res = search$(s, [1])

    expect(res.puts).to.eql([])
    expect(res.calls(mod.item.all).callCount()).to.equal(0)
  })

  it('writes nothing when it finds the same results', () => {
    let { puts: [{ payload }] } = search$(state({ matches: null }), [1, 2])

    expect(payload.matches).to.eql({ 1: true, 2: true })
    expect(search$(state(payload), [2, 1]).puts).to.eql([])
  })

  it('keeps selected items in the results as matches', () => {
    // Item 3 is selected but no longer matches (e.g. after an edit).
    let { puts: [{ payload }] } =
      search$(state({ matches: null }, '', [3]), [1, 2])

    expect(payload.matches).to.eql({ 1: true, 2: true, 3: true })
  })

  it('keeps only selected items that belong to the view', () => {
    let s = state({ matches: null }, '', [3])
    s.nav.list = 1
    s.nav.sort = { 1: { column: 'added', asc: true } }
    s.items[3] = { ...s.items[3], lists: [] }

    let { puts: [{ payload }] } = run(search(null), {
      state: s,
      mocks: [
        [mod.item.list, () => ({ items: [1, 2] })],
        [termLists, () => []]
      ]
    })

    expect(payload.items).to.eql([1, 2])
  })
})

describe('contributors', () => {
  const state = ({ query = 'box', item = [1], photo = 11, note = null } = {}) => ({
    nav: { query, item: create(item), photo, selection: null, note },
    qr: {
      items: [1, 2],
      contributors: { photos: { 12: true }, notes: { 7: true } }
    },
    settings: { search: { filter: true } },
    items: {
      1: { id: 1, photos: [11, 12] },
      2: { id: 2, photos: [] }
    },
    photos: {
      11: { id: 11, item: 1, notes: [], selections: [] },
      12: { id: 12, item: 1, notes: [6, 7], selections: [] }
    },
    selections: {},
    notes: { 6: { id: 6, photo: 12 }, 7: { id: 7, photo: 12 } }
  })

  const lists = [{ subjects: Int32Array.of(2, 12), notes: Int32Array.of(7) }]

  const contribute$ = (s, prev, terms = lists) =>
    run(contribute(null, prev), {
      state: s,
      mocks: [[cachedLists, () => null], [termLists, () => terms]]
    })

  it('takes a snapshot when the selection or the query changes', () => {
    let { puts, result } = contribute$(state())

    expect(puts[0].payload.contributors).to.eql({
      photos: { 12: true },
      notes: { 7: true }
    })

    // Edits change the lists, not the snapshot.
    expect(contribute$(state(), result, []).puts).to.eql([])
  })

  it('narrows after a new snapshot only', () => {
    let { calls, result } = contribute$(state())
    expect(calls(narrow).callCount()).to.equal(1)

    expect(contribute$(state(), result).calls(narrow).callCount())
      .to.equal(0)
  })

  it('clears the contributors without terms', () => {
    let { puts } = contribute$(state({ query: '' }))
    expect(puts[0].payload.contributors).to.be.null
  })

  it('moves to the first visible photo and note when hidden', () => {
    let { puts } = run(narrow(), { state: state() })
    expect(puts[0].payload).to.eql({ photo: 12, selection: null, note: 7 })

    expect(run(narrow(), { state: state({ photo: 12, note: 7 }) }).puts)
      .to.eql([])
  })
})

describe('termLists', () => {
  const lists = { subjects: Int32Array.of(1), notes: Int32Array.of() }
  const term = { text: 'box', prefix: true, scope: 'any' }
  let query

  beforeEach(() => {
    query = mock.method(mod.item, 'term', () => Promise.resolve(lists))
  })

  afterEach(() => {
    query.mock.restore()
  })

  it('shares a term query already running', async () => {
    let db = { generation: 0 }
    await Promise.all([termLists(db, [term]), termLists(db, [term])])
    expect(query.mock.callCount()).to.equal(1)

    await termLists(db, [term])
    expect(query.mock.callCount()).to.equal(1)
  })

  it('does not share a query started before a write', async () => {
    let db = { generation: 0 }
    let before = termLists(db, [term])
    db.generation++

    await Promise.all([before, termLists(db, [term])])
    expect(query.mock.callCount()).to.equal(2)
  })
})

