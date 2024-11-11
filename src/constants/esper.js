export default {
  RESTORE: 'esper.restore',
  UPDATE: 'esper.update',


  MODE: {
    FIT: 'fit',
    FILL: 'fill',
    ZOOM: 'zoom'
  },

  TOOL: {
    ARROW: 'arrow',
    PAN: 'pan',
    SELECT: 'selection',
    ZOOM_IN: 'zoomIn',
    ZOOM_OUT: 'zoomOut'
  },

  OVERLAY: {
    NONE: false,
    SPLIT: 'split',
    FULL: 'full'
  },

  COLOR: {
    mask: {
      line: { color: 0xffffff, alpha: 1 },
      fill: { color: 0x000000, alpha: 0.4 }
    },
    selection: {
      default: {
        line: { color: 0x5c93e5, alpha: 1 },
        fill: { color: 0xcedef7, alpha: 0.4 }
      },
      active: {
        line: { color: 0x5c93e5, alpha: 1 },
        fill: { color: 0xcedef7, alpha: 0.8 }
      },
      live: {
        line: { color: 0x5c93e5, alpha: 1 },
        fill: { color: 0xcedef7, alpha: 0.8 }
      }
    }
  }
}
