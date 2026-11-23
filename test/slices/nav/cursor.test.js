import { create } from '#tropy/common/selection.js'
import {
  selectNavCursor,
  selectNoteCursor,
  selectPhotoCursor,
  selectSelectionCursor
} from '#tropy/slices/nav/cursor.js'

describe('nav cursor', () => {
  // Item 1 with photos 2 (selection 3, notes 10, 11) and 4 (note 12);
  // item 5 with photo 6. With the match filter, 4 and 12 match.
  let state = ({ item = [1], photo, note = null, filter = false, cursor } = {}) => ({
    nav: {
      selection: {
        item: create(item),
        photo: create(photo == null ? [] : [photo]),
        note
      }
    },
    qr: {
      items: [1, 5],
      contributors: { photos: { 4: true }, notes: { 12: true }, cursor }
    },
    settings: { search: { filter } },
    items: { 1: { id: 1, photos: [2, 4] }, 5: { id: 5, photos: [6] } },
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

  it('falls back below the parent', () => {
    // A photo of another item, a note of another photo.
    expect(path({ photo: 6 })).to.include({ photo: 2, note: 10 })
    expect(path({ photo: 2, note: 12 })).to.include({ photo: 2, note: 10 })
  })

  it('falls back when hidden by the match filter', () => {
    let cursor = { photo: 2, note: 10 }

    expect(path({ photo: 2, note: 10, filter: true, cursor }))
      .to.include({ photo: 4, note: 12 })

    // Selected since the snapshot: visible.
    expect(path({ photo: 2, note: 10, filter: true, cursor: { photo: 4 } }))
      .to.include({ photo: 2, note: 10 })
  })

  it('is stable until a cursor changes', () => {
    let s = state({ photo: 2, note: 10 })
    let first = selectNavCursor(s)

    let count = selectNoteCursor.recomputations()

    // A note edited: no cursor is computed again.
    let edited = { ...s, notes: { ...s.notes, 10: { id: 10, photo: 2 } } }
    expect(selectNavCursor(edited)).to.equal(first)
    expect(selectNoteCursor.recomputations()).to.equal(count)
  })
})
