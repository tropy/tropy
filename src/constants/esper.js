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
    STYLE: '-webkit-image-set(url(./images/esper/%{name}@1x.svg) 1x, url(./images/esper/%{name}@2x.svg) 2x) 1 1,default',
    pan: { default: 'grab', active: 'grabbing' },
    select: { default: 'crosshairs', active: 'crosshairs' }
  }
}
