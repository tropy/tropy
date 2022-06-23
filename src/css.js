import { Cursor } from './res.js'
import { win32 } from './common/os.js'

export function imageSet(...paths) {
  return `-webkit-image-set(${
    paths.map((path, idx) => `${url(path)} ${idx + 1}x`).join(', ')
  })`
}

export function url(path) {
  return `url(file://${win32 ? path.replace(/\\/g, '/') : path})`
}

export function cursor(path, { x = 1, y = 1, fallback = 'default' } = {}) {
  return `${Array.isArray(path) ?
    imageSet(...path.map(Cursor.expand)) :
    url(Cursor.expand(path))} ${x} ${y}, ${fallback}`
}

export function rgb(r = 0, g = 0, b = 0, a = 1) {
  return `rgb(${r},${g},${b},${a})`
}
