'use strict'

module.exports = {
  MODE: {
    FIT: 'fit',
    FILL: 'fill',
    ZOOM: 'zoom'
  },

  TOOL: {
    ARROW: 'arrow',
    PAN: 'pan',
    SELECT: 'select'
  },

  COLOR: {
    mask: {
      line: [0xffffff, 1],
      fill: [0x000000, 0.4]
    },
    selection: {
      default: {
        line: [0x5c93e5, 1],
        fill: [0xcedef7, 0.4]
      },
      active: {
        line: [0x5c93e5, 1],
        fill: [0xcedef7, 0.8]
      },
      live: {
        line: [0x5c93e5, 1],
        fill: [0xcedef7, 0.8]
      }
    }
  }
}
