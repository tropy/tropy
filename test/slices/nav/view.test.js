import { listOf, isActivity, isList, sortKey } from '#tropy/slices/nav/view.js'

describe('nav view', () => {
  it('has a list only for lists', () => {
    expect(listOf({ name: 'list', id: 3 })).to.equal(3)
    expect(listOf({ name: 'unlisted' })).to.be.null
    expect(listOf({ name: 'project' })).to.be.null
  })

  it('shares the root sort, except for lists', () => {
    expect(sortKey({ name: 'list', id: 3 })).to.equal(3)
    expect(sortKey({ name: 'unlisted' })).to.equal(0)
    expect(sortKey({ name: 'trash' })).to.equal(0)
    expect(sortKey({ name: 'activity', type: 'item.import' })).to.equal(0)
  })

  it('shows a list by id', () => {
    expect(isList({ name: 'list', id: 3 }, 3)).to.be.true
    expect(isList({ name: 'list', id: 3 }, 4)).to.be.false
    expect(isList({ name: 'project' }, null)).to.be.false
  })

  it('shows an activity by type and id, the past one without id', () => {
    let view = { name: 'activity', type: 'item.import', id: 9 }

    expect(isActivity(view, 'item.import', 9)).to.be.true
    expect(isActivity(view, 'item.import', 8)).to.be.false
    expect(isActivity(view, 'item.export', 9)).to.be.false
    expect(isActivity({ ...view, id: null }, 'item.import', 8)).to.be.true
  })
})
