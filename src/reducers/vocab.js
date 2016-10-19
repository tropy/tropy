'use strict'

const init = {
  title: { name: 'title', type: 'text' },
  type: { name: 'type', type: 'text' },
  date: { name: 'date', type: 'text' },
  box: { name: 'box', type: 'number' },
  photos: { name: 'photos', type: 'number' }
}

module.exports = {
  vocab(state = init, action) {
    switch (action.type) {
      default:
        return state
    }
  }
}
