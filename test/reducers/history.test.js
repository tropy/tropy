import { HISTORY, PHOTO, SELECTION } from '#tropy/constants/index.js'
import { history } from '#tropy/reducers/history.js'

describe('History Reducer', () => {
  const tick = (undo, mode = 'merge') => ({
    type: HISTORY.TICK,
    payload: { undo, redo: undo },
    meta: { mode }
  })

  const order = (item) => ({
    type: PHOTO.ORDER,
    payload: { item, photos: [] }
  })

  describe('merge mode', () => {
    const reduce = (...undos) =>
      undos.reduce((state, undo) => history(state, tick(undo)), undefined)

    it('merges consecutive ticks for the same item', () => {
      expect(reduce(order(1), order(1)).past).to.have.length(1)
    })

    it('does not merge ticks for different items', () => {
      expect(reduce(order(1), order(2)).past).to.have.length(2)
    })

    it('keeps the original undo when merging', () => {
      let [first, second] = [order(1), order(1)]
      second.payload.photos = [3, 2, 1]

      expect(reduce(first, second).past[0].undo).to.equal(first)
    })

    it('does not merge ticks of different types', () => {
      expect(reduce(order(1), {
        type: SELECTION.ORDER,
        payload: { photo: 1, selections: [] }
      }).past).to.have.length(2)
    })

    it('merges selection ticks by photo', () => {
      let sel = (photo) => ({
        type: SELECTION.ORDER,
        payload: { photo, selections: [] }
      })

      expect(reduce(sel(1), sel(1)).past).to.have.length(1)
      expect(reduce(sel(1), sel(2)).past).to.have.length(2)
    })

    it('merges saves by id', () => {
      let save = (id) => ({ type: PHOTO.SAVE, payload: { id, data: {} } })

      expect(reduce(save(1), save(1)).past).to.have.length(1)
      expect(reduce(save(1), save(2)).past).to.have.length(2)
    })

    it('does not merge when the subject cannot be identified', () => {
      let undo = { type: PHOTO.SAVE, payload: { data: {} } }

      expect(reduce(undo, undo).past).to.have.length(2)
    })
  })

  it('adds a new entry unless the mode is merge', () => {
    let state = history(undefined, tick(order(1), 'add'))

    expect(history(state, tick(order(1), 'add')).past).to.have.length(2)
  })
})
