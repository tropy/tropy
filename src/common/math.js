'use strict'

const math = {
  isHorizontal(deg) {
    return deg < 45 || deg > 315 || (deg > 135 && deg < 225)
  },

  deg(rad) {
    return (360 + (rad / Math.PI) * 180) % 360
  },

  rad(deg) {
    return (deg / 180) * Math.PI
  },

  round(value, precision = 1) {
    return Math.round(value * precision) / precision
  },

  rotate(deg, by) {
    return (360 + ((deg + by) % 360)) % 360
  }
}

module.exports = math
