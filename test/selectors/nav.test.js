import { listOf, sortKey } from '#tropy/selectors/nav.js'

describe('nav selectors', () => {
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
})
