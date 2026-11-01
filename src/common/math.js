
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

export function rotate (deg, by) {
  return (360 + ((deg + by) % 360)) % 360
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

// https://github.com/tc39/proposal-seeded-random
// https://github.com/tc39/proposal-random-functions
// NB: uses sfc32 instead of ChaCha12 for speed.
export class Seeded {
  #a
  #b
  #c
  #d

  // The seed is a Uint8Array of up to 32 bytes, zero-padded at the front;
  // its two halves are combined into sfc32's 128 bits of state.
  constructor (seed) {
    if (!(seed instanceof Uint8Array))
      throw new TypeError('seed must be a Uint8Array')
    if (seed.length > 32)
      throw new RangeError('seed must be 32 bytes or less')

    let bytes = new Uint8Array(32)
    bytes.set(seed, 32 - seed.length)

    let view = new DataView(bytes.buffer)
    let word = (i) => (view.getUint32(i) ^ view.getUint32(16 + i)) >>> 0

    this.#a = word(0)
    this.#b = word(4)
    this.#c = word(8)
    this.#d = word(12)

    // Mix the seed bits into the state before use.
    for (let i = 0; i < 15; ++i) this.#next()
  }

  #next () {
    let t = (this.#a + this.#b) | 0
    this.#a = this.#b ^ (this.#b >>> 9)
    this.#b = (this.#c + (this.#c << 3)) | 0
    this.#c = (this.#c << 21) | (this.#c >>> 11)
    this.#d = (this.#d + 1) | 0
    t = (t + this.#d) | 0
    this.#c = (this.#c + t) | 0
    return t >>> 0
  }

  // Returns a number in [0, 1).
  random () {
    return this.#next() / 4294967296
  }

  // Returns an integer in [lo, hi].
  int (lo, hi) {
    return lo + Math.floor(this.random() * (hi - lo + 1))
  }
}
