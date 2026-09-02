import { LIST, PHOTO } from '#tropy/constants/index.js'
import { items as itemsReducer } from '#tropy/reducers/items.js'

describe('Items Reducer', () => {
  let state
  let action

  describe(LIST.ITEM.ADD, () => {
    beforeEach(() => {
      state = {
        1: { id: 1, lists: [] },
        2: { id: 2, lists: [1] }
      }

      action = {
        type: LIST.ITEM.ADD,
        payload: { id: 1, items: [1] },
        meta: {}
      }
    })

    it('skips unless the action has done', () => {
      expect(itemsReducer(state, action)).to.equal(state)
    })

    it('adds list to all items', () => {
      action.meta.done = true
      expect(itemsReducer(state, action)[1].lists).to.eql([1])
    })
  })

  describe(LIST.ITEM.REMOVE, () => {
    beforeEach(() => {
      state = {
        1: { id: 1, lists: [1] },
        2: { id: 2, lists: [1, 2] }
      }

      action = {
        type: LIST.ITEM.REMOVE,
        payload: { id: 1, items: [1, 2] },
        meta: {}
      }
    })

    it('skips unless the action has done', () => {
      expect(itemsReducer(state, action)).to.equal(state)
    })

    it('removes list from all items', () => {
      action.meta.done = true

      expect(itemsReducer(state, action)[1].lists).to.eql([])
      expect(itemsReducer(state, action)[2].lists).to.eql([2])
    })
  })

  describe(PHOTO.ORDER, () => {
    let was = Date.now() - 1000

    beforeEach(() => {
      state = {
        1: { id: 1, photos: [1, 2, 3], modified: new Date(0) }
      }

      action = {
        type: PHOTO.ORDER,
        payload: { id: 1, photos: [3, 1, 2] },
        meta: { was }
      }
    })

    it('skips unless the action has done', () => {
      expect(itemsReducer(state, action)).to.equal(state)
    })

    it('skips on error', () => {
      action.meta.done = true
      action.error = true

      expect(itemsReducer(state, action)).to.equal(state)
    })

    it('updates the order and the modification timestamp', () => {
      action.meta.done = true
      let item = itemsReducer(state, action)[1]

      expect(item.photos).to.eql([3, 1, 2])
      expect(item.modified).to.eql(new Date(was))
    })

    it('uses the timestamp written by the command, not the current one', () => {
      action.meta.done = true
      action.meta.now = Date.now()

      expect(itemsReducer(state, action)[1].modified).to.eql(new Date(was))
    })
  })
})
