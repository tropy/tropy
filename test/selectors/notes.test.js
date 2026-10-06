import { getNoteSuccessor } from '#tropy/selectors/index.js'

describe('Note Selectors', () => {
  describe('getNoteSuccessor', () => {
    let state = (note, photos = { 1: [10, 11], 2: [12] }) => ({
      nav: { items: [1], note },
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
})
