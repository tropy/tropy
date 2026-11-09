import {
  getNoteSuccessor,
  getVisibleNotes,
  getVisiblePhotos
} from '#tropy/selectors/index.js'
import { create } from '#tropy/common/selection.js'

describe('Note Selectors', () => {
  describe('getNoteSuccessor', () => {
    let state = (note, photos = { 1: [10, 11], 2: [12] }) => ({
      nav: { item: create([1]), note },
      qr: { items: [1] },
      settings: { search: { filter: false } },
      items: { 1: { id: 1, photos: Object.keys(photos).map(Number) } },
      photos: Object.fromEntries(Object.entries(photos).map(([id, notes]) =>
        [id, { id: Number(id), notes, selections: [] }])),
      selections: {},
      notes: {
        10: { id: 10, photo: 1 },
        11: { id: 11, photo: 1 },
        12: { id: 12, photo: 2 }
      }
    })

    it('prefers adjacent notes of the same photo', () => {
      expect(getNoteSuccessor(state(10))).to.have.property('id', 11)
      expect(getNoteSuccessor(state(11))).to.have.property('id', 10)
    })

    it('falls back to the adjacent note', () => {
      expect(getNoteSuccessor(state(12))).to.have.property('id', 11)
    })

    it('returns nothing without other notes', () => {
      expect(getNoteSuccessor(state(10, { 1: [10] }))).to.be.null
    })
  })

  describe('match filter', () => {
    let state = (filter) => ({
      nav: { item: create([1]) },
      qr: {
        items: [1],
        contributors: { photos: { 2: true }, notes: { 12: true } }
      },
      settings: { search: { filter } },
      items: { 1: { id: 1, photos: [1, 2] } },
      photos: {
        1: { id: 1, notes: [10], selections: [] },
        2: { id: 2, notes: [11, 12], selections: [] }
      },
      selections: {},
      notes: {
        10: { id: 10, photo: 1 },
        11: { id: 11, photo: 2 },
        12: { id: 12, photo: 2 }
      }
    })

    it('shows only contributing photos and notes when on', () => {
      expect(getVisiblePhotos(state(true)).map(p => p.id)).to.eql([2])
      expect(getVisibleNotes(state(true)).map(n => n.id)).to.eql([12])
    })

    it('keeps the current photo and note visible', () => {
      let s = state(true)
      s.nav = { ...s.nav, photo: 1, note: 10 }

      expect(getVisiblePhotos(s).map(p => p.id)).to.eql([1, 2])
      expect(getVisibleNotes(s).map(n => n.id)).to.eql([10, 12])
    })

    it('shows all photos and notes when off', () => {
      expect(getVisiblePhotos(state(false)).map(p => p.id)).to.eql([1, 2])
      expect(getVisibleNotes(state(false)).map(n => n.id)).to.eql([10, 11, 12])
    })
  })
})
