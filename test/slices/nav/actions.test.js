import { createStore } from '../../support/react.js'
import { create, has } from '#tropy/common/selection.js'
import nav from '#tropy/slices/nav/index.js'
import qr from '#tropy/slices/qr.js'
import * as act from '#tropy/actions/index.js'

describe('select actions', () => {
  // Items 1 (photos 5, 6; 5 with selection 9) and 2 (photo 8),
  // both selected, the cursor on 2.
  let store
  let selection = () => store.getState().nav.select

  beforeEach(() => {
    let init = nav(undefined, {})

    store = createStore({
      items: {
        1: { id: 1, photos: [5, 6], tags: [], lists: [] },
        2: { id: 2, photos: [8], tags: [], lists: [] }
      },
      photos: {
        5: { id: 5, item: 1, notes: [7], selections: [9] },
        6: { id: 6, item: 1, notes: [], selections: [] },
        8: { id: 8, item: 2, notes: [10], selections: [] }
      },
      selections: { 9: { id: 9, photo: 5, notes: [11] } },
      // Note 11 is a selection's note: it has no photo.
      notes: {
        7: { id: 7, photo: 5 },
        10: { id: 10, photo: 8 },
        11: { id: 11, selection: 9 }
      },
      nav: { ...init, select: { ...init.select, item: create([1, 2]) } },
      // Item 1 is not among the results.
      qr: { ...qr(undefined, {}), items: [2], matches: { 2: true } },
      intl: { messages: {} }
    })
  })

  it('select.item leaves the photo and note to the reducer', () => {
    store.dispatch(act.nav.select.item({ item: 1 }))
    expect(selection()).to.nested.include({ 'photo.cursor': 5, 'note.cursor': 7 })
  })

  it('select.item selects below the item cursor', () => {
    // Item 2 deselected, the cursor stays on it.
    store.dispatch(act.nav.select.item({ item: create([1], { anchor: 2 }) }))
    expect(selection()).to.nested.include({ 'photo.cursor': 5 })
  })

  it('check their targets', () => {
    for (let select of [
      () => act.nav.select.item({ item: 1, photo: 8 }),
      () => act.nav.select.item({ item: 1, photo: 5, selection: 9, note: 7 }),
      () => act.nav.select.item({ item: 1, selection: 99 }),
      () => act.nav.select.photo({ item: 1, photo: 8 }),
      () => act.nav.select.note({ note: 10, photo: 5 }),
      () => act.nav.open.item({ id: 3 })
    ]) {
      expect(() => store.dispatch(select())).to.throw()
    }

    expect(selection().item).to.include({ cursor: 2 })
  })

  it('open.item keeps a selected item in the selection, in item mode', () => {
    store.dispatch(act.nav.open.item({ id: 2, photo: 8 }))

    expect(has(selection().item, 1)).to.be.true
    expect(selection()).to.nested.include({
      'item.cursor': 2, 'photo.cursor': 8, 'note.cursor': 10
    })
    expect(store.getState().nav.mode).to.equal('item')

    // The panel expands the photo opened.
    expect(store.getState().panel.expand[8]).to.be.above(0)
  })

  it('select.note and open.item complete the path from a note', () => {
    store.dispatch(act.nav.select.note({ note: 10 }))
    expect(selection()).to.nested.include({
      'item.cursor': 2, 'photo.cursor': 8, 'note.cursor': 10
    })

    store.dispatch(act.nav.open.item({ note: 11 }))
    expect(selection()).to.nested.include({
      'item.cursor': 1, 'photo.cursor': 9, 'note.cursor': 11
    })
    expect(store.getState().nav.mode).to.equal('item')
  })

  it('open.item shows an item not among the results first', () => {
    store.dispatch(act.nav.show({ view: { name: 'list', id: 3 } }))
    store.dispatch(act.nav.select.item({ item: 2 }))
    store.dispatch(act.nav.open.item({ id: 1 }))

    let { nav } = store.getState()
    expect(nav.search.view).to.eql({ name: 'project' })
    expect(nav).to.nested.include({ 'select.item.cursor': 1, mode: 'item' })
    expect(has(nav.select.item, 2)).to.be.false
  })
})
