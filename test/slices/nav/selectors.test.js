import { create } from '#tropy/common/selection.js'
import {
  selectActiveItems,
  selectNavCursor,
  selectPhotoCursor,
  selectSelectionCursor
} from '#tropy/slices/nav/selectors.js'

describe('nav cursor', () => {
  // Item 1 with photos 2 (selection 3, notes 10, 11) and 4 (note 12);
  // item 5 with photo 6; item 9, not among the results.
  let state = ({ item = [1], photo, note = null } = {}) => ({
    nav: {
      select: {
        item: create(item),
        photo: create(photo == null ? [] : [photo]),
        note: create(note == null ? [] : [note])
      }
    },
    qr: { items: [1, 5] },
    items: {
      1: { id: 1, photos: [2, 4] },
      5: { id: 5, photos: [6] },
      9: { id: 9, photos: [] }
    },
    photos: {
      2: { id: 2, item: 1, selections: [3], notes: [10, 11] },
      4: { id: 4, item: 1, selections: [], notes: [12] },
      6: { id: 6, item: 5, selections: [], notes: [] }
    },
    selections: { 3: { id: 3, photo: 2, notes: [] } },
    notes: {
      10: { id: 10, photo: 2 },
      11: { id: 11, photo: 2 },
      12: { id: 12, photo: 4 }
    }
  })

  let path = (options) => selectNavCursor(state(options))

  it('resolves the cursors from the primary item down', () => {
    expect(path({ photo: 2, note: 11 }))
      .to.eql({ item: 1, photo: 2, selection: null, note: 11 })

    let s = state({ photo: 3 })
    expect(selectPhotoCursor(s)).to.equal(2)
    expect(selectSelectionCursor(s)).to.equal(3)
  })

  it('keeps none', () => {
    expect(path({ photo: 2 })).to.include({ photo: 2, note: null })
    expect(path()).to.include({ item: 1, photo: null, note: null })
    expect(path({ item: [] })).to.include({ item: null, photo: null })
  })

  it('lists the active items in display order, not primary first', () => {
    let s = state({ item: [9, 1, 5] })

    expect(selectActiveItems(s).map(it => it.id)).to.eql([1, 5, 9])
    expect(path({ item: [9, 1, 5] })).to.include({ item: 5 })
  })

  it('keeps the active items while the selected items stay', () => {
    let s = state({ item: [1, 5] })
    let first = selectActiveItems(s)

    let other = { ...s, items: { ...s.items, 9: { id: 9, photos: [6] } } }
    expect(selectActiveItems(other)).to.equal(first)

    let edited = { ...s, items: { ...s.items, 1: { id: 1, photos: [4] } } }
    expect(selectActiveItems(edited)).to.not.equal(first)
  })

  it('reads the stored cursors as they are', () => {
    // A photo of another item, a note of another photo.
    expect(path({ photo: 6, note: 12 })).to.include({ photo: 6, note: 12 })
  })

  it('is stable until a cursor changes', () => {
    let s = state({ photo: 2, note: 10 })
    let first = selectNavCursor(s)

    // A note edited: the same nav cursor.
    let edited = { ...s, notes: { ...s.notes, 10: { id: 10, photo: 2 } } }
    expect(selectNavCursor(edited)).to.equal(first)
  })
})
