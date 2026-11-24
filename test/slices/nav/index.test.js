import { EDIT, ITEM, LIST, TAG } from '#tropy/constants/index.js'
import nav, * as act from '#tropy/slices/nav/index.js'
import { create, has } from '#tropy/common/selection.js'
import { cancel, dismiss } from '#tropy/slices/activities.js'
import {
  itemOpened,
  itemSelected,
  noteSelected,
  photoSelected
} from '#tropy/slices/nav/actions.js'

const init = nav(undefined, {})

// A nav with items 1 selected and the given search.
const state = (search) => ({
  ...init,
  search: { ...init.search, ...search },
  select: { ...init.select, item: create([1]) }
})

const isKept = (s) => has(s.select.item, 1)

describe('nav', () => {
  it('restores the selection state, keeping anchor and cursor', () => {
    let payload = {
      select: { item: { selected: { 1: true, 3: true }, anchor: 1, cursor: 3 } }
    }
    let { item } = nav(undefined, act.restore(payload)).select

    expect(item).to.include({ anchor: 1, cursor: 3 })
    expect(has(item, 1) && has(item, 3)).to.be.true
  })

  it('restores the selection with another view (not a search change)', () => {
    let restored = nav(init, act.restore({
      search: { view: { name: 'list', id: 3 } },
      select: { item: create([1]) },
      mode: 'item'
    }))

    expect(restored.search.view).to.eql({ name: 'list', id: 3 })
    expect(restored.mode).to.equal('item')
    expect(isKept(restored)).to.be.true
  })

  it('restores no sort from malformed state', () => {
    let s = nav(undefined, act.restore({ search: { sort: 'x' } }))
    expect(s.search.sort).to.eql({})
  })

  it('replaces the selection state on select', () => {
    let item = create([3])
    let s = nav(undefined, { type: itemSelected.type, payload: { item }, meta: {} })
    expect(s.select.item).to.equal(item)
  })

  describe('shows the parent item of a photo or note', () => {
    // Items 1 and 2 selected, the cursor on 2.
    let s = {
      ...init,
      select: { ...init.select, item: create([1, 2]) }
    }

    let item = (action) => nav(s, action).select.item

    it('keeps the selection if the parent is selected', () => {
      for (let action of [
        { type: photoSelected.type, payload: { item: 1, photo: 5 }, meta: {} },
        { type: noteSelected.type, payload: { item: 1, photo: 5, note: 7 }, meta: {} }
      ]) {
        expect(has(item(action), 2), action.type).to.be.true
        expect(item(action), action.type).to.include({ cursor: 1, anchor: 1 })
      }

      expect(nav(s, { type: photoSelected.type, payload: { item: 1, photo: 5 }, meta: {} })
        .select.photo.cursor).to.equal(5)
    })

    it('replaces the selection with an unselected parent', () => {
      for (let action of [
        { type: photoSelected.type, payload: { item: 3, photo: 5 }, meta: {} },
        { type: noteSelected.type, payload: { item: 3, photo: 5, note: 7 }, meta: {} }
      ]) {
        expect(has(item(action), 2), action.type).to.be.false
        expect(item(action), action.type).to.include({ cursor: 3, anchor: 3 })
      }
    })
  })

  describe('drops removed items from the selection', () => {
    // Items 1 and 2 selected, the cursor on 2, a photo shown.
    let selected = (search) => {
      let s = state(search)
      return {
        ...s,
        select: { ...s.select, item: create([1, 2]), photo: create([5]) }
      }
    }

    let request = (type, payload) =>
      ({ type, payload, meta: { cmd: 'project' } })

    it('when deleted, restored or removed', () => {
      for (let action of [
        request(ITEM.DELETE, [2]),
        request(ITEM.RESTORE, [2]),
        { type: ITEM.REMOVE, payload: [2], meta: {} }
      ]) {
        let { select: selection } = nav(selected(), action)

        expect(isKept({ select: selection }), action.type).to.be.true
        expect(has(selection.item, 2), action.type).to.be.false
        expect(selection.item.cursor, action.type).to.be.null
        expect(selection.photo, action.type).to.eql(create())
      }
    })

    it('unless none of them is selected', () => {
      let s = selected()
      expect(nav(s, request(ITEM.DELETE, [3]))).to.equal(s)
    })

    it('when removed from the list shown only', () => {
      let list = { name: 'list', id: 3 }
      let remove = request(LIST.ITEM.REMOVE, { id: 3, items: [2] })

      let shown = nav(selected({ view: list }), remove).select
      expect(has(shown.item, 2)).to.be.false
      expect(has(shown.item, 1)).to.be.true

      for (let other of [selected({ view: { name: 'list', id: 4 } }), selected()])
        expect(nav(other, remove)).to.equal(other)
    })
  })

  describe('photo level', () => {
    // Photo 5 of item 1 shown, with its selection 6 and note 7.
    let s = {
      ...init,
      select: {
        item: create([1]), photo: create([6]), note: create([7]), last: {}
      }
    }

    let photo = (action) => nav(s, action).select.photo

    it('holds the photo or the photo selection shown', () => {
      let select = (payload) => ({ type: photoSelected.type, payload, meta: {} })

      expect(photo(select({ item: 1, photo: 5 }))).to.include({ cursor: 5 })
      expect(photo(select({ item: 1, photo: 5, selection: 6 }))).to.include({ cursor: 6 })
      expect(photo(select(null))).to.eql(create())
      expect(nav(s, select({ photo: null, note: 7 })).select.note.cursor)
        .to.be.null
    })

    it('is decided from the facts when an item is selected', () => {
      // Item 2 (photos 8, 9) or item 1 (photo 5 with selection 6).
      let select = (item, payload) => nav(s, {
        type: itemSelected.type,
        payload: { item: create(item), ...payload },
        meta: {}
      }).select

      let other = { photos: [8, 9], notes: { 8: [], 9: [10] } }
      let same = { photos: [5], notes: { 5: [], 6: [7, 4] } }

      // The item's first photo, its first note.
      expect(select([2], other))
        .to.nested.include({ 'photo.cursor': 8, 'note.cursor': null })
      expect(select([2], { ...other, photo: 9 }))
        .to.nested.include({ 'photo.cursor': 9, 'note.cursor': 10 })

      // The cursor stays if it is the item's, the note with it.
      expect(select([1, 3], { photos: [], notes: {} }).photo.cursor)
        .to.be.null
      expect(select([3, 1], same))
        .to.nested.include({ 'photo.cursor': 6, 'note.cursor': 7 })

      // A note given (null is none).
      expect(select([3, 1], { ...same, note: null }).note.cursor).to.be.null

      // Without facts: none.
      expect(select([1, 2], {}))
        .to.nested.include({ 'photo.cursor': null, 'note.cursor': null })
    })

    it('is restored', () => {
      let restored = nav(undefined, act.restore({ select: s.select }))
      expect(restored.select.photo).to.include({ cursor: 6 })
    })
  })

  describe('note level', () => {
    // Photo 5 of item 1 shown; it has notes 7 and 8, photo 9 has none.
    let reduce = (...actions) => actions.reduce(nav, {
      ...init,
      select: { ...init.select, item: create([1]), photo: create([5]) }
    })

    let action = (type, payload) => ({ type, payload, meta: {} })
    let note = (id) => action(noteSelected.type, { item: 1, photo: 5, note: id })
    let photo = (id, notes) => action(photoSelected.type, { item: 1, photo: id, notes })

    it('shows the last note of a photo again', () => {
      let s = reduce(note(8), photo(9, []), photo(5, [7, 8]))
      expect(s.select.note.cursor).to.equal(8)
    })

    it('keeps the last notes when the selection is cleared', () => {
      let s = reduce(note(8), act.show({ view: { name: 'trash' } }))

      expect(s.select.note.cursor).to.be.null
      expect(s.select.last).to.eql({ 5: 8 })
    })

    it('shows the first note if the last is gone', () => {
      let s = reduce(note(8), photo(9, []), photo(5, [7]))
      expect(s.select.note.cursor).to.equal(7)
    })

    it('is restored', () => {
      let { select: selection } = reduce(note(8))
      let restored = nav(undefined, act.restore({ select: selection }))

      expect(restored.select.note).to.include({ cursor: 8 })
      expect(restored.select.last).to.eql({ 5: 8 })
    })
  })

  it('selects tags to filter by', () => {
    let tags = (s, id, mode) =>
      nav(s, { type: TAG.SELECT, payload: id, meta: { mode } }).search.tags

    let s = state({ tags: [1, 2] })
    expect(tags(s, 3)).to.eql([3])
    expect(tags(s, 3, 'toggle')).to.eql([1, 2, 3])
    expect(tags(s, 1, 'toggle')).to.eql([2])
    expect(tags(s, 1, 'clear')).to.eql([])
  })

  describe('keeps the selection when the search can only widen', () => {
    it('on query changes', () => {
      let search = (from, to) =>
        nav(state({ query: from }), act.search({ query: to }))

      expect(isKept(search('box lett', 'box let'))).to.be.true
      expect(isKept(search('box', ''))).to.be.true
      expect(isKept(search('box', 'box lett'))).to.be.false
    })

    it('on tag filter changes', () => {
      let select = (mode, id = 5) =>
        nav(state({ tags: [5] }), { type: TAG.SELECT, payload: id, meta: { mode } })

      expect(isKept(select('toggle'))).to.be.true
      expect(isKept(select('toggle', 6))).to.be.false
      expect(isKept(select('replace', 6))).to.be.false

      let deleted = nav(state({ tags: [5] }),
        { type: TAG.DELETE, payload: 5, meta: { done: true } })
      expect(deleted.search.tags).to.eql([])
      expect(isKept(deleted)).to.be.true
    })

    it('on showing the view already shown', () => {
      expect(isKept(nav(state(), act.show({})))).to.be.true
      expect(isKept(nav(state(), act.show({ view: { name: 'trash' } }))))
        .to.be.false
    })

    it('on showing the same activity, with or without an id', () => {
      let past = { name: 'activity', type: 'item.import', id: null }
      let s = nav(state({ view: past }),
        act.show({ view: { name: 'activity', type: 'item.import' } }))
      expect(isKept(s)).to.be.true
    })

    it('on view changes to a containing view', () => {
      let list = { name: 'list', id: 3 }
      let show = (from, to) =>
        isKept(nav(state({ view: from }), act.show({ view: to })))

      expect(show(list, { name: 'project' })).to.be.true
      expect(show({ name: 'unlisted' }, { name: 'project' })).to.be.true
      expect(show({ name: 'project' }, list)).to.be.false
      expect(show(list, { name: 'list', id: 4 })).to.be.false
      expect(show({ name: 'trash' }, { name: 'project' })).to.be.false
      expect(show({ name: 'project' }, { name: 'trash' })).to.be.false

      let removed = nav(state({ view: list }),
        { type: LIST.REMOVE, payload: 3, meta: {} })
      expect(isKept(removed)).to.be.true

      let collapsed = nav(state({ view: list }),
        { type: LIST.COLLAPSE, payload: 2, meta: { select: true } })
      expect(isKept(collapsed)).to.be.false
    })

    it('on sorting, also with an invalid query', () => {
      let query = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
      let s = nav(state({ query }), act.sort({ column: 'x', asc: true }))
      expect(isKept(s)).to.be.true
    })
  })

  describe('view', () => {
    let imports = { name: 'activity', type: 'item.import', id: null }
    let view = (s) => s.search.view

    it('is the project by default', () => {
      expect(view(init)).to.eql({ name: 'project' })
    })

    it('takes only the view, query and tags shown', () => {
      let s = nav(init, act.show({ view: { name: 'trash' }, sort: { 0: {} } }))
      expect(s.search.sort).to.eql({})
      expect(nav(init, act.search({ query: 'x', view: { name: 'trash' } }))
        .search).to.include({ query: 'x' })
        .and.to.have.nested.property('view.name', 'project')
    })

    it('keeps the filters unless given', () => {
      let s = state({ query: 'x', tags: [5] })
      let shown = (payload) => nav(s, act.show(payload)).search

      expect(shown({ view: { name: 'trash' } }))
        .to.include({ query: 'x' }).and.have.property('tags').eql([5])
      expect(shown({ view: { name: 'trash' }, query: '', tags: [] }))
        .to.include({ query: '' }).and.have.property('tags').eql([])
    })

    it('is replaced on select, back to the project by default', () => {
      let s = state({ view: imports })
      expect(view(nav(s, act.show({ view: { name: 'trash' } }))))
        .to.eql({ name: 'trash' })
      expect(view(nav(s, act.show({}))))
        .to.eql({ name: 'project' })
    })

    it('keeps an activity for searches and tag filters', () => {
      let s = state({ view: imports })
      expect(view(nav(s, act.search({ query: 'x' })))).to.equal(imports)
      expect(view(nav(s, { type: TAG.SELECT, payload: 1, meta: {} })))
        .to.equal(imports)
    })

    it('keeps the trash for tag filters', () => {
      let s = nav(state({ view: { name: 'trash' } }),
        { type: TAG.SELECT, payload: 1, meta: {} })
      expect(view(s)).to.eql({ name: 'trash' })
      expect(s.search.tags).to.eql([1])
    })

    it('returns to the project when its list is removed', () => {
      let s = state({ view: { name: 'list', id: 3 } })
      expect(nav(s, { type: LIST.REMOVE, payload: 4, meta: {} })).to.equal(s)
      expect(view(nav(s, { type: LIST.REMOVE, payload: 3, meta: {} })))
        .to.eql({ name: 'project' })
    })

    it('selects a collapsed parent list if hinted', () => {
      let s = state({ view: { name: 'list', id: 3 } })
      let collapse = (select) =>
        view(nav(s, { type: LIST.COLLAPSE, payload: 2, meta: { select } }))

      expect(collapse(false)).to.eql({ name: 'list', id: 3 })
      expect(collapse(true)).to.eql({ name: 'list', id: 2 })
    })

    it('returns to the project when its activity is dismissed', () => {
      let s = state({ view: imports })
      expect(nav(s, dismiss('item.export'))).to.equal(s)

      let dismissed = nav(s, dismiss('item.import'))
      expect(view(dismissed)).to.eql({ name: 'project' })
      expect(isKept(dismissed)).to.be.true
    })

    it('keeps the view of a busy activity that is cancelled', () => {
      let s = state({ view: { ...imports, id: 9 } })
      expect(nav(s, cancel(9))).to.equal(s)
    })

    it('keeps the view of an activity that is done (see selectActivity)', () => {
      let s = state({ view: { ...imports, id: 9 } })
      let done = { type: 'item.import', meta: { done: true, rel: 9 } }
      expect(nav(s, done)).to.equal(s)
    })

    it('returns to the project when the past activity shown is dismissed', () => {
      let s = state({ view: { ...imports, id: 9 } })
      expect(nav(s, dismiss('item.import', 8))).to.equal(s)
      expect(view(nav(s, dismiss('item.import', 9))))
        .to.eql({ name: 'project' })
    })

    it('keeps a live run when its completed record is dismissed', () => {
      let s = state({ view: { ...imports, id: 9 } })
      expect(nav(s, dismiss('item.import'))).to.equal(s)
    })

    it('is restored', () => {
      let restore = (v) =>
        view(nav(undefined, act.restore({ search: { view: v } })))

      expect(restore({ name: 'list', id: 3 })).to.eql({ name: 'list', id: 3 })
      expect(restore({ name: 'unknown' })).to.eql({ name: 'project' })
      expect(view(nav(undefined, act.restore(undefined))))
        .to.eql({ name: 'project' })
    })

    it('restores the activity view with a negative id', () => {
      let s = nav(undefined,
        act.restore({ search: { view: { ...imports, id: 9 } } }))

      expect(view(s)).to.eql({ ...imports, id: -9 })
    })
  })

  describe('mode', () => {
    let itemMode = { ...state(), mode: 'item' }
    let mode = (s, action) => nav(s, action).mode

    let select = (payload) => ({ type: itemSelected.type, payload, meta: {} })

    it('switches to the item when opened', () => {
      expect(mode(init, itemOpened({ item: create([1]) }))).to.equal('item')
      expect(mode(init, select({ item: create([1]) }))).to.equal('project')
      expect(mode(itemMode, select({ item: create([1]) }))).to.equal('item')
    })

    it('goes back to the project', () => {
      expect(mode(itemMode, act.mode.back())).to.equal('project')
      expect(mode(itemMode, act.show({}))).to.equal('project')
    })

    it('goes back to the project to edit a tag or list', () => {
      let edit = (payload) => ({ type: EDIT.START, payload, meta: {} })

      expect(mode(itemMode, edit({ tag: { id: 1 } }))).to.equal('project')
      expect(mode(itemMode, edit({ list: { id: 1 } }))).to.equal('project')
      expect(mode(itemMode, edit({ note: { id: 1 } }))).to.equal('item')
    })

    it('goes back to the project without a selected item', () => {
      let remove = { type: ITEM.REMOVE, payload: [1], meta: {} }

      expect(mode(itemMode, remove)).to.equal('project')
      expect(nav(undefined, act.restore({ mode: 'item' })).mode)
        .to.equal('project')
    })

    it('restores only known modes', () => {
      let item = { item: create([1]) }

      expect(nav(undefined, act.restore({ mode: 'item', select: item })).mode)
        .to.equal('item')
      expect(nav(undefined, act.restore({ mode: 'x' })).mode).to.equal('project')
      expect(nav(undefined, act.restore({ mode: 'constructor' })).mode)
        .to.equal('project')
    })
  })

  describe('selectors', () => {
    let root = (search) => ({ nav: state(search) })
    let list = { name: 'list', id: 3 }

    it('sort the view shown, by default title or list position', () => {
      expect(act.selectSort(root()).column).to.match(/title$/)
      expect(act.selectSort(root({ view: list })).column).to.equal('added')

      let s = nav(state({ view: list }), act.sort({ column: 'x', asc: false }))
      expect(s.search.sort).to.eql({ 3: { column: 'x', asc: false } })
      expect(act.selectSort({ nav: s })).to.eql({ column: 'x', asc: false })

      let trash = { ...s, search: { ...s.search, view: { name: 'trash' } } }
      expect(act.selectSort({ nav: trash }).column).to.match(/title$/)
    })

    it('select the list shown and test the view', () => {
      expect(act.selectList(root({ view: list }))).to.equal(3)
      expect(act.selectList(root())).to.be.null
      expect(act.selectIsView(root({ view: { name: 'trash' } }), 'trash')).to.be.true
      expect(act.selectIsView(root(), 'trash')).to.be.false
    })
  })
})
