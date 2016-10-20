'use strict'

const init = {
  1: {
    id: 1,
    image: 'dev/dummy',
    title: {
      value: 'Application Norman Bailey',
      type: 'string'
    },
    type: {
      value: 'Application Form',
      type: 'string'
    },
    date: {
      value: '1897-07-26',
      type: 'date'
    },
    box: {
      value: '17',
      type: 'number'
    },
    photos: {
      value: '2',
      type: 'number'
    }
  },
  2: {
    id: 2,
    image: 'dev/dummy',
    title: {
      value: 'Norman Bailey',
      type: 'string'
    },
    type: {
      value: 'Portrait',
      type: 'string'
    },
    date: {
      value: '1844',
      type: 'date'
    },
    box: {
      value: '17',
      type: 'number'
    },
    photos: {
      value: '1',
      type: 'number'
    }
  },
  3: {
    id: 3,
    image: 'dev/dummy',
    title: {
      value: 'Application H. F. Cary',
      type: 'string'
    },
    type: {
      value: 'Application Form',
      type: 'string'
    },
    date: {
      value: '1899-10-24',
      type: 'date'
    },
    box: {
      value: '17',
      type: 'number'
    },
    photos: {
      value: '2',
      type: 'number'
    }
  },
  4: {
    id: 4,
    image: 'dev/dummy',
    title: {
      value: 'Frank Cary',
      type: 'string'
    },
    type: {
      value: 'Portrait',
      type: 'string'
    },
    date: {
      value: '1868',
      type: 'date'
    },
    box: {
      value: '17',
      type: 'number'
    },
    photos: {
      value: '1',
      type: 'number'
    }
  },
  5: {
    id: 5,
    image: 'dev/dummy',
    title: {
      value: 'Denver to Chicago',
      type: 'string'
    },
    type: {
      value: 'Correspondence',
      type: 'string'
    },
    date: {
      value: '1899-12-24',
      type: 'date'
    },
    box: {
      value: '27',
      type: 'number'
    },
    photos: {
      value: '2',
      type: 'number'
    }
  }
}

module.exports = {
  items(state = init, { type }) {
    switch (type) {
      default:
        return state
    }
  }
}
