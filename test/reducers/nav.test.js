import { ITEM, NAV, TAG } from '#tropy/constants/index.js'
import { nav } from '#tropy/reducers/nav.js'
import { create, has } from '#tropy/common/selection.js'

describe('Nav Reducer', () => {
  it('restores selected items persisted as an array', () => {
    let { item } = nav(undefined, { type: NAV.RESTORE, payload: { items: [1, 2] } })
    expect(item).to.include({ anchor: 2, cursor: 2 })
    expect(has(item, 1) && has(item, 2)).to.be.true
  })

  it('restores the selection state, keeping anchor and cursor', () => {
    let payload = { item: { selected: { 1: true, 3: true }, anchor: 1, cursor: 3 } }
    let { item } = nav(undefined, { type: NAV.RESTORE, payload })

    expect(item).to.include({ anchor: 1, cursor: 3 })
    expect(has(item, 1) && has(item, 3)).to.be.true
    expect(Object.getPrototypeOf(item.selected)).to.be.null
  })

  it('replaces the selection state on select', () => {
    let item = create([3])
    let state = nav(undefined, { type: ITEM.SELECT, payload: { item }, meta: {} })
    expect(state.item).to.equal(item)
  })

  it('resets the selection when selected items are deleted', () => {
    let state = { ...nav(undefined, {}), item: create([1, 2]) }
    let action = { type: ITEM.DELETE, payload: [2], meta: {} }
    expect(nav(state, action).item.anchor).to.be.null
  })

  it('selects tags to filter by', () => {
    let tags = (state, id, mod) =>
      nav(state, { type: TAG.SELECT, payload: id, meta: { mod } }).tags

    let state = { ...nav(undefined, {}), tags: [1, 2] }
    expect(tags(state, 3)).to.eql([3])
    expect(tags(state, 3, 'merge')).to.eql([1, 2, 3])
    expect(tags(state, 1, 'remove')).to.eql([2])
    expect(tags(state, 1, 'clear')).to.eql([])
  })

  describe('keeps the selection when the search can only widen', () => {
    let state = (props) =>
      ({ ...nav(undefined, {}), item: create([1]), ...props })
    let isKept = (s) => has(s.item, 1)

    it('on query changes', () => {
      let search = (from, to) =>
        nav(state({ query: from }), { type: NAV.SEARCH, payload: { query: to } })

      expect(isKept(search('box lett', 'box let'))).to.be.true
      expect(isKept(search('box', ''))).to.be.true
      expect(isKept(search('box', 'box lett'))).to.be.false
    })

    it('on tag filter changes', () => {
      let select = (mod, id = 5) =>
        nav(state({ tags: [5] }), { type: TAG.SELECT, payload: id, meta: { mod } })

      expect(isKept(select('remove'))).to.be.true
      expect(isKept(select('merge', 6))).to.be.false
      expect(isKept(select('replace', 6))).to.be.false

      let deleted = nav(state({ tags: [5] }),
        { type: TAG.DELETE, payload: 5, meta: { done: true } })
      expect(deleted.tags).to.eql([])
      expect(isKept(deleted)).to.be.true
    })
  })
})
