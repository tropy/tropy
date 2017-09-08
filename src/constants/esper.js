'use strict'

module.exports = {
  MODE: {
    FIT: 'fit',
    FILL: 'fill',
    ZOOM: 'zoom'
  },

  TOOL: {
    PAN: 'pan',
    SELECT: 'select'
  },

  CURSOR: {
    arrow: {
      default: 'arrow',
      active: 'arrow',
      move: 'arrow',
      resize: {
        ew: 'arrow',
        ns: 'arrow',
        nesw: 'arrow',
        nwse: 'arrow'
      },
      x: 1,
      y: 1
    },
    pan: {
      default: 'grab',
      active: 'grabbing',
      x: 9,
      y: 10
    },
    select: {
      default: 'crosshairs',
      active: 'crosshairs',
      x: 7,
      y: 7
    }
  }
}
