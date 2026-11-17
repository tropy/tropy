import { ITEM, LIST, NAV, TAG } from '#tropy/constants/index.js'
import { nav } from '#tropy/reducers/nav.js'
import { create, has } from '#tropy/common/selection.js'
import { dismiss } from '#tropy/slices/completed.js'

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

  describe('view', () => {
    let state = (props) =>
      ({ ...nav(undefined, {}), item: create([1]), ...props })
    let imports = { name: 'activity', type: 'item.import' }

    it('is the project by default', () => {
      expect(nav(undefined, {}).view).to.eql({ name: 'project' })
    })

    it('is replaced on select, back to the project by default', () => {
      let s = state({ view: imports })
      expect(nav(s, { type: NAV.SELECT, payload: { view: { name: 'trash' } } }).view)
        .to.eql({ name: 'trash' })
      expect(nav(s, { type: NAV.SELECT, payload: {} }).view)
        .to.eql({ name: 'project' })
    })

    it('keeps an activity for searches and tag filters', () => {
      let s = state({ view: imports })
      expect(nav(s, { type: NAV.SEARCH, payload: { query: 'x' } }).view)
        .to.equal(imports)
      expect(nav(s, { type: TAG.SELECT, payload: 1, meta: {} }).view)
        .to.equal(imports)
    })

    it('leaves the trash for tag filters', () => {
      let s = nav(state({ view: { name: 'trash' } }),
        { type: TAG.SELECT, payload: 1, meta: {} })
      expect(s.view).to.eql({ name: 'project' })
      expect(s.tags).to.eql([1])
    })

    it('returns to the project when its list is removed', () => {
      let s = state({ view: { name: 'list', id: 3 } })
      expect(nav(s, { type: LIST.REMOVE, payload: 4, meta: {} })).to.equal(s)
      expect(nav(s, { type: LIST.REMOVE, payload: 3, meta: {} }).view)
        .to.eql({ name: 'project' })
    })

    it('selects a collapsed parent list if hinted', () => {
      let s = state({ view: { name: 'list', id: 3 } })
      let collapse = (select) =>
        nav(s, { type: LIST.COLLAPSE, payload: 2, meta: { select } }).view

      expect(collapse(false)).to.eql({ name: 'list', id: 3 })
      expect(collapse(true)).to.eql({ name: 'list', id: 2 })
    })

    it('returns to the project when its activity is dismissed', () => {
      let s = state({ view: imports })
      expect(nav(s, dismiss('item.export'))).to.equal(s)

      let dismissed = nav(s, dismiss('item.import'))
      expect(dismissed.view).to.eql({ name: 'project' })
      expect(has(dismissed.item, 1)).to.be.false
    })

    it('keeps a live run when its completed record is dismissed', () => {
      let s = state({ view: { name: 'activity', type: 'item.import', seq: 9 } })
      expect(nav(s, dismiss('item.import'))).to.equal(s)
    })

    it('is restored, also from legacy state', () => {
      let restore = (payload) =>
        nav(undefined, { type: NAV.RESTORE, payload }).view

      expect(restore({ view: { name: 'list', id: 3 } })).to.eql({ name: 'list', id: 3 })
      expect(restore({ view: imports })).to.eql(imports)
      expect(restore({ list: 3 })).to.eql({ name: 'list', id: 3 })
      expect(restore({ list: -1 })).to.eql({ name: 'unlisted' })
      expect(restore({ trash: true })).to.eql({ name: 'trash' })
      expect(restore({ list: null, trash: null })).to.eql({ name: 'project' })
      expect(restore(undefined)).to.eql({ name: 'project' })
    })

    it('restores no live runs, nor legacy fields', () => {
      let s = nav(undefined, {
        type: NAV.RESTORE,
        payload: {
          view: { name: 'activity', type: 'item.import', seq: 9 },
          list: 3,
          trash: true,
          activity: 'item.import',
          imports: true
        }
      })

      expect(s.view).to.eql(imports)
      expect(s).not.to.have.any.keys('list', 'trash', 'activity', 'imports')
    })
  })
})
