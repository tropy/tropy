
export function isClockwise (deg1, deg2) {
  let a = deg1 % 360
  let b = deg2 % 360

  return (a < b) ?
      (b - a) <= 180 :
      (a - b) >= 180
}

export function isHorizontal (deg) {
  return deg < 45 || deg > 315 || (deg > 135 && deg < 225)
}

export function deg (rad) {
  return (360 + (rad / Math.PI) * 180) % 360
}

export function rad (deg) {
  return (deg / 180) * Math.PI
}

export function round (value, precision = 1) {
  return Math.round(value * precision) / precision
}

export function rounded (src) {
  let res = {}
  for (let key in src) res[key] = ~~src[key]
  return res
}

export function translate (a, { top = 0, bottom = 0, left = 0, right = 0 }) {
  return {
    top: a.top + top,
    bottom: a.bottom + bottom,
    left: a.left + left,
    right: a.right + right
  }
}

export function rotate (deg, by) {
  return (360 + ((deg + by) % 360)) % 360
}

// Invariant: a <= b and c <= d
export function expansion ([a, b] = [], [c, d] = []) {
  if (a == null) return 0
  if (c == null) return 1

  return (b > d ? 1 : 0) - (a < c ? 1 : 0)
}

// Invariant: a <= b and c <= d
export function shift ([a, b], [c, d]) {
  if (b - a > d - c)
    return (c + d) / 2 - (a + b) / 2

  if (a < c) return c - a
  if (b > d) return d - b

  return 0
}

export function contains (rect, {
  x,
  y,
  width = 0,
  height = 0,
  left = x,
  top = y,
  right = x + width,
  bottom = y + height
}) {
  return (
    left >= rect.left && right <= rect.right &&
    top >= rect.top && bottom <= rect.bottom
  )
}
