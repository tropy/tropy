import { run } from '../support/saga.js'
import { search, sync } from '#tropy/sagas/search.js'
import { update } from '#tropy/slices/qr.js'
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
})

describe('search saga', () => {
  const state = (qr) => ({
    intl: { locale: 'en' },
    nav: { sort: {}, list: null, tags: [], query: '' },
    imports: [],
    qr
  })

  const search$ = (s, ids) =>
    run(search(null), {
      state: s,
      mocks: [[mod.item.all, () => ({ items: ids })]]
    })

  it('writes nothing when it finds the same results', () => {
    let { puts: [{ payload }] } = search$(state({ matches: null }), [1, 2])

    expect(payload.matches).to.eql({ 1: true, 2: true })
    expect(search$(state(payload), [2, 1]).puts).to.eql([])
  })
})
