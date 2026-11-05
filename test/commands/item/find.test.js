import { run } from '../../support/saga.js'
import { Find } from '#tropy/commands/item/find.js'
import act from '#tropy/actions/api.js'
import * as mod from '#tropy/models/index.js'

const TITLE = 'http://purl.org/dc/elements/1.1/title'

describe('ItemFind', () => {
  const title = (id, text) => ({ id, [TITLE]: { text, type: 'text' } })

  const state = (qr = {}) => ({
    intl: { locale: 'en' },
    items: { 1: { id: 1 }, 2: { id: 2 }, 3: { id: 3 }, 4: { id: 4 } },
    metadata: {
      1: title(1, 'b10'),
      2: title(2, 'b2'),
      3: title(3, 'a'),
      4: title(4, 'c')
    },
    ontology: { template: {} },
    qr: { order: [], sort: null, ...qr }
  })

  const exec = (payload, s = state(), mocks = []) =>
    run(new Find(act.item.find(payload), { db: null }).exec(), {
      state: s,
      mocks: [
        [mod.item.all, () => ({ items: [4, 2, 1] })],
        [mod.item.list, () => ({ items: [2, 4] })],
        // NOCASE order: b10 before b2.
        [mod.item.seed, () => [3, 1, 2, 4]],
        ...mocks
      ]
    })

  const ids = ({ result }) => result.map(item => item.id)

  it('sorts by the collator, not SQL', () => {
    expect(ids(exec({}))).to.eql([2, 1, 4])
    expect(ids(exec({ sort: { asc: false } }))).to.eql([4, 1, 2])
  })

  it('uses the order of the UI for the same sort', () => {
    let s = state({
      order: [1, 3, 2, 4],
      sort: { column: TITLE, asc: true, locale: 'en' }
    })
    let res = exec({}, s)

    expect(ids(res)).to.eql([1, 2, 4])
    expect(res.calls(mod.item.seed).callCount()).to.equal(0)
  })

  it('reverses the order of the UI for the other direction', () => {
    let s = state({
      order: [3, 2, 1, 4],
      sort: { column: TITLE, asc: true, locale: 'en' }
    })
    let res = exec({ sort: { asc: false } }, s)

    expect(ids(res)).to.eql([4, 1, 2])
    expect(res.calls(mod.item.seed).callCount()).to.equal(0)
  })

  it('keeps the list order when sorting by position', () => {
    let res = exec({ list: 1 })

    expect(ids(res)).to.eql([2, 4])
    expect(exec({ list: 1, sort: { asc: false } }).result.map(it => it.id))
      .to.eql([4, 2])
    expect(res.calls(mod.item.seed).callCount()).to.equal(0)
  })
})
