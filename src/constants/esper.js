'use strict'

module.exports = {
  RESTORE: 'esper.restore',
  UPDATE: 'esper.update',


  MODE: {
    FIT: 'fit',
    FILL: 'fill',
    ZOOM: 'zoom'
  },

  PLACEMENT: {
    FULL: 'note-pad-hidden',
    HIDDEN: 'note-pad-full',
    LEFT: 'note-pad-right',
    TOP: 'note-pad-bottom'
  },

  TOOL: {
    ARROW: 'arrow',
    PAN: 'pan',
    SELECT: 'select',
    ZOOM_IN: 'zoomIn',
    ZOOM_OUT: 'zoomOut'
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
