'use strict'

const { URL } = require('url')
const { rotate } = require('./math')


class Rotation {
  constructor(input = {}) {
    if (typeof input === 'string') {
      this.parse(input)
    } else {
      this.set(input)
    }
  }

  set({ angle = 0, mirror = false }) {
    this.angle = angle
    this.mirror = mirror
  }

  add({ angle, mirror = false }) {
    if (angle != null) {
      this.angle = rotate(this.angle, angle)
    }

    if (mirror) {
      this.mirror = !this.mirror
    }

    return this
  }

  subtract({ angle = 0, mirror = false }) {
    return this.add({ angle: -angle, mirror })
  }

  parse(input = '') {
    this.angle = parseFloat(input.slice(1))
    this.mirror = input.startsWith('!')
    return this
  }

  format(symbol = '!') {
    return `${this.mirror ? symbol : ''}${this.angle}`
  }

  get orientation() {
    switch (this.angle) {
      case 0:
        return this.mirror ? 2 : 1
      case 90:
        return this.mirror ? 7 : 6
      case 180:
        return this.mirror ? 4 : 3
      case 270:
        return this.mirror ? 5 : 8
      default:
        throw new Error('invalid angle')
    }
  }

  toJSON() {
    return { angle: this.angle, mirror: this.mirror }
  }

  static fromExifOrientation(orientation) {
    switch (orientation) {
      case 2:
        return new Rotation({ angle: 0, mirror: true })
      case 3:
        return new Rotation({ angle: 180, mirror: false })
      case 4:
        return new Rotation({ angle: 180, mirror: true })
      case 5:
        return new Rotation({ angle: 270, mirror: true })
      case 6:
        return new Rotation({ angle: 90, mirror: false })
      case 7:
        return new Rotation({ angle: 90, mirror: true })
      case 8:
        return new Rotation({ angle: 270, mirror: false })
      default:
        return new Rotation()
    }
  }
}

class IIIF extends URL {
}

module.exports = {
  IIIF,
  Rotation
}
