'use strict'

const { LIST } = __require('constants')

describe('Items Reducer', () => {
  const reduce = __require('reducers/items')

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
      expect(reduce.items(state, action)).to.equal(state)
    })

    it('adds list to all items', () => {
      action.meta.done = true
      expect(reduce.items(state, action)[1].lists).to.eql([1])
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
      expect(reduce.items(state, action)).to.equal(state)
    })

    it('removes list from all items', () => {
      action.meta.done = true

      expect(reduce.items(state, action)[1].lists).to.eql([])
      expect(reduce.items(state, action)[2].lists).to.eql([2])
    })
  })
})
