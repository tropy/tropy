import { LIST } from '../../src/constants'
import { items as itemsReducer } from '../../src/reducers/items'

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
})
