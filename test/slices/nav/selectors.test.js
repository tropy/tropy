import { create } from '#tropy/common/selection.js'
import {
  selectActiveItemIds,
  selectActiveItems,
  selectCursorPhoto,
  selectCursorSelection,
  selectActiveNoteIds,
  selectActivePhotoIds,
  selectNavCursor,
  selectPhotoCursor,
  selectPhotoSequence
} from '#tropy/slices/nav/selectors.js'

describe('nav cursor', () => {
  // Item 1 with photos 2 (selection 3 with note 13; notes 10, 11) and 4 (note 12);
  // item 5 with photo 6; item 9, not among the results.
  let state = ({
    item = [1], photo, note = null, expand = {}, zoom = 0
  } = {}) => ({
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
    selections: { 3: { id: 3, photo: 2, notes: [13] } },
    notes: {
      10: { id: 10, photo: 2 },
      11: { id: 11, photo: 2 },
      12: { id: 12, photo: 4 },
      13: { id: 13, photo: 2, selection: 3 }
    },
    panel: { expand },
    ui: { panel: { zoom } }
  })

  let path = (options) => selectNavCursor(state(options))

  it('resolves the cursors from the item cursor down', () => {
    expect(path({ photo: 2, note: 11 }))
      .to.eql({ item: 1, photo: 2, selection: null, note: 11 })

    let s = state({ photo: 3 })
    expect(selectPhotoCursor(s)).to.equal(3)
    expect(selectCursorPhoto(s).id).to.equal(2)
    expect(selectCursorSelection(s).id).to.equal(3)
  })

  it('keeps none', () => {
    expect(path({ photo: 2 })).to.include({ photo: 2, note: null })
    expect(path()).to.include({ item: 1, photo: null, note: null })
    expect(path({ item: [] })).to.include({ item: null, photo: null })
  })

  it('lists the active items in display order, not the cursor first', () => {
    let s = state({ item: [9, 1, 5] })

    // Item 9 is not among the results.
    expect(selectActiveItems(s).map(it => it.id)).to.eql([1, 5])
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

  it('keeps the active item ids while the selected results stay', () => {
    let s = state({ item: [1, 5] })
    let first = selectActiveItemIds(s)

    // The cursor moves, item 9 joins the results.
    let moved = {
      ...s,
      nav: { ...s.nav, select: { ...s.nav.select, item: { ...s.nav.select.item, cursor: 1 } } },
      qr: { items: [1, 5, 9] }
    }
    expect(selectActiveItemIds(moved)).to.equal(first)
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

  it('keeps the active photo ids while the photo lists stay', () => {
    let s = state({ item: [1, 5] })
    let first = selectActivePhotoIds(s)
    expect(first).to.eql([2, 4, 6])

    let tagged = { ...s, items: { ...s.items, 1: { id: 1, photos: [2, 4], tags: [7] } } }
    expect(selectActivePhotoIds(tagged)).to.equal(first)
  })

  it('navigates the photos with their expanded selections in the list', () => {
    let expand = { 2: 1 }
    expect(selectPhotoSequence(state({ expand }))).to.eql([2, 3, 4])
    expect(selectPhotoSequence(state({ expand, zoom: 1 }))).to.eql([2, 4])
  })

  it('keeps the photo sequence while the displayed ids stay', () => {
    let s = state({ expand: { 2: 1 } })
    let first = selectPhotoSequence(s)

    // An active photo is edited (same selections).
    let edited = { ...s, photos: { ...s.photos, 2: { ...s.photos[2], title: 'x' } } }
    expect(selectPhotoSequence(edited)).to.equal(first)
  })

  it('lists the active notes interleaved, collapsed selections too', () => {
    expect(selectActiveNoteIds(state())).to.eql([10, 11, 13, 12])
  })
})
