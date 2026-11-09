import { run } from '../../support/saga.js'
import { Open } from '#tropy/commands/item/open.js'
import * as act from '#tropy/actions/index.js'

describe('Open item', () => {
  let state = (matches = { 1: true }) => ({
    nav: {},
    qr: { matches },
    items: { 1: { id: 1, photos: [2], deleted: true } },
    photos: { 2: { id: 2, notes: [] } },
    selections: { 3: { id: 3, photo: 2, notes: [] } }
  })

  let exec = (payload) =>
    run(new Open(act.item.open(payload)).exec(), { state: state() }).result

  it('opens items, photos and selections', () => {
    expect(exec({ id: 1 })).to.include({ id: 1, photo: 2 })
    expect(exec({ id: 1, photo: 2, selection: 3 }))
      .to.include({ id: 1, photo: 2, selection: 3 })
  })

  it('opens nothing for unknown or unrelated ids', () => {
    for (let payload of [
      { id: 9 },
      { id: 1, photo: 5 },
      { id: 1, photo: 2, selection: 4 },
      { id: 1, selection: 3 }
    ]) {
      expect(exec(payload), JSON.stringify(payload)).to.be.null
    }
  })

  it('switches to a view that shows items not among the results', () => {
    let open = (matches) => run(new Open(act.item.open({ id: 1 })).exec(),
      { state: state(matches) }).puts

    expect(open({ 1: true })).to.eql([])
    expect(open({}).map(({ type, payload }) => ({ type, payload })))
      .to.eql([{ type: 'nav.select', payload: { trash: true, query: '' } }])
  })
})
