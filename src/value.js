import { TYPE } from './constants'

export function date(input) {
  return { text: input, type: TYPE.DATE }
}

export function text(input) {
  return { text: input, type: TYPE.TEXT }
}

export function value(input, type) {
  return { text: input, type: type || TYPE.TEXT }
}

export function equal(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false

  return a.type === b.type && a.text === b.text
}
