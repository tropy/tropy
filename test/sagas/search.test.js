import { run } from '../support/saga.js'
import { search } from '#tropy/sagas/search.js'
import * as mod from '#tropy/models/index.js'

describe('search saga', () => {
  const find = (activity, completed) =>
    run(search(null), {
      state: {
        nav: { activity, query: '', tags: [], sort: {} },
        imports: [],
        completed
      }
    })

  it('searches the refs of the completed activity shown', () => {
    let now = Date.now()
    let t = find('item.import', [
      { type: 'item.import', init: now, done: now, keep: 60000, refs: [1, 2] }
    ])

    expect(t.calls(mod.item.find).calls[0].arguments[1].ids)
      .to.eql([1, 2])
  })

  it('falls back to all items if the activity is gone', () => {
    let t = find('item.import', [])

    expect(t.calls(mod.item.find).callCount()).to.equal(0)
    expect(t.calls(mod.item.all).callCount()).to.equal(1)
  })
})
