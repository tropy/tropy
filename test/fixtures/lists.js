'use strict'

module.exports = {
  root: {
    id: 0,
    children: [1, 2]
  },

  empty: {
    id: -1,
    name: 'An empty list',
    children: []
  },

  1: {
    id: 1,
    name: 'A list apart',
    children: []
  },
  2: {
    id: 2,
    name: 'Todo',
    children: []
  }
}
