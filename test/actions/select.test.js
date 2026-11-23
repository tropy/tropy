import { createStore } from '../support/react.js'
import { create, has } from '#tropy/common/selection.js'
import nav from '#tropy/slices/nav/index.js'
import qr from '#tropy/slices/qr.js'
import * as act from '#tropy/actions/index.js'

describe('select actions', () => {
  // Items 1 (photos 5, 6; 5 with selection 9) and 2 (photo 8),
  // both selected, the cursor on 2.
  let store
  let selection = () => store.getState().nav.selection

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
      notes: {},
      nav: { ...init, selection: { ...init.selection, item: create([1, 2]) } },
      // Item 1 is not among the results.
      qr: { ...qr(undefined, {}), matches: { 2: true } },
      intl: { messages: {} }
    })
  })

  it('item.select leaves the photo and note to the reducer', () => {
    store.dispatch(act.item.select({ item: 1 }))
    expect(selection()).to.nested.include({ 'photo.cursor': 5, note: 7 })
  })

  it('check their targets', () => {
    for (let select of [
      () => act.item.select({ item: 1, photo: 8 }),
      () => act.item.select({ item: 1, photo: 5, selection: 9, note: 7 }),
      () => act.photo.select({ item: 1, photo: 8 }),
      () => act.note.select({ note: 10, photo: 5 }),
      () => act.item.open({ id: 3 })
    ]) {
      expect(() => store.dispatch(select())).to.throw()
    }

    expect(selection().item).to.include({ cursor: 2 })
  })

  it('item.open keeps a selected item in the selection, in item mode', () => {
    store.dispatch(act.item.open({ id: 2, photo: 8 }))

    expect(has(selection().item, 1)).to.be.true
    expect(selection()).to.nested.include({
      'item.cursor': 2, 'photo.cursor': 8, note: 10
    })
    expect(store.getState().nav.mode).to.equal('item')
  })

  it('item.open shows an item not among the results first', () => {
    store.dispatch(act.nav.show({ view: { name: 'list', id: 3 } }))
    store.dispatch(act.item.select({ item: 2 }))
    store.dispatch(act.item.open({ id: 1 }))

    let { nav } = store.getState()
    expect(nav.search.view).to.eql({ name: 'project' })
    expect(nav).to.nested.include({ 'selection.item.cursor': 1, mode: 'item' })
    expect(has(nav.selection.item, 2)).to.be.false
  })
})
