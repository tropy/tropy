'use strict'

const math = {
  isClockwise(deg1, deg2) {
    let a = deg1 % 360
    let b = deg2 % 360

    return (a < b) ?
      (b - a) <= 180 :
      (a - b) >= 180
  },

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

  rounded(src) {
    let res = {}
    for (let key in src) res[key] = ~~src[key]
    return res
  },

  translate(a, { top = 0, bottom = 0, left = 0, right = 0 }) {
    return {
      top: a.top + top,
      bottom: a.bottom + bottom,
      left: a.left + left,
      right: a.right + right
    }
  },

  rotate(deg, by) {
    return (360 + ((deg + by) % 360)) % 360
  }
}

module.exports = math
