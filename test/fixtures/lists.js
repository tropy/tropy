export default {
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
    parent: 0,
    children: [3]
  },
  2: {
    id: 2,
    name: 'Todo',
    parent: 0,
    children: []
  },
  3: {
    id: 3,
    name: 'A/B',
    parent: 1,
    children: []
  }
}
