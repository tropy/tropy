import { URL } from 'node:url'
import { rotate, round, isHorizontal } from './math.js'
import { Cache } from './cache.js'
import { pick } from './util.js'

export class Rotation {
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

  mode({ width, height }, h = this.isHorizontal) {
    return (width < height) ?
        (h ? 'portrait' : 'landscape') :
        (h ? 'landscape' : 'portrait')
  }

  ratio({ width, height }) {
    if (!this.isHorizontal)
      [width, height] = [height, width]

    if (width > height)
      return [1, round(height / width, 100)]
    if (width < height)
      return [round(width / height, 100), 1]
    else
      return [1, 1]
  }

  get isHorizontal() {
    return isHorizontal(this.angle)
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

  static addExifOrientation(state, { orientation }) {
    return Rotation
      .fromExifOrientation(orientation)
      .add(state)
  }

  static subExifOrientation(state, { orientation }) {
    return new Rotation(state)
      .subtract(Rotation.fromExifOrientation(orientation))
  }
}

export class IIIF extends URL {
}

export const addOrientation = (image, photo = image) => {
  let { width, height } = image
  let rot = Rotation.fromExifOrientation(photo.orientation)

  // Chromium 81+ automatically applies image orientation.
  // Our cached variants are saved without metadata so they will *not*
  // be oriented automatically and, therefore, we need to handle the
  // angle and mirror properties differently in each case.

  // When using cache variants, use original aspect ratio and add
  // orientation to image state.
  if (Cache.isCacheVariant('full', photo))
    return { ...rot.add(image).toJSON(), width, height }

  // Otherwise use image state, but adjust aspect ratio if necessary.
  let { angle, mirror } = image

  if (!rot.isHorizontal) {
    width = photo.height
    height = photo.width
  }

  return { angle, mirror, width, height }
}

export const subOrientation = (image, photo) => {
  if (Cache.isCacheVariant('full', photo))
    return Rotation.subExifOrientation(image, photo).toJSON()
  else
    return pick(image, ['angle', 'mirror'])
}
