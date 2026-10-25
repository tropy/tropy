import { run } from '../../support/saga.js'
import { ListShow } from '#tropy/commands/api/list.js'
import act from '#tropy/actions/api.js'

describe('ListShow', () => {
  let lists = {
    0: { id: 0, children: [1] },
    1: { id: 1, children: [2] },
    2: { id: 2, children: [3] },
    3: { id: 3, children: [] }
  }

  let exec = (payload) =>
    run(new ListShow(act.list.show(payload)).exec(), { state: { lists } })
      .result.map(list => list.id)

  it('expands all descendants', () => {
    expect(exec({ id: 0, expand: true })).to.eql([1, 2, 3])
    expect(exec({ id: 1, expand: true })).to.eql([2, 3])
  })
})
