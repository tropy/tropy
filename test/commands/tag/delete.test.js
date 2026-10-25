import { run } from '../../support/saga.js'
import { Delete } from '#tropy/commands/tag/create.js'
import * as act from '#tropy/actions/index.js'
import * as mod from '#tropy/models/index.js'

describe('Delete tag', () => {
  let exec = (id) => run(new Delete(act.tag.delete(id), { db: {} }).exec(), {
    state: { tags: { 1: { id: 1, name: 'Foo' } } },
    mocks: [[mod.tag.items, () => []]]
  })

  it('deletes the tag', () => {
    let t = exec(1)
    expect(t.result).to.equal(1)
    expect(t.calls(mod.tag.delete).callCount()).to.equal(1)
  })

  it('skips unknown tags', () => {
    let t = exec(2)
    expect(t.result).to.be.null
    expect(t.calls(mod.tag.delete).callCount()).to.equal(0)
  })
})
