import { run } from '../../support/saga.js'
import { Open } from '#tropy/commands/item/open.js'
import * as act from '#tropy/actions/index.js'

describe('Open item', () => {
  let exec = (payload) => run(new Open(act.item.open(payload)).exec(), {
    state: {
      nav: {},
      items: { 1: { id: 1, photos: [2] } },
      photos: { 2: { id: 2, notes: [] } },
      selections: { 3: { id: 3, photo: 2, notes: [] } }
    }
  }).result

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
})
