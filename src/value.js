import * as datatype from './common/datatype.js'

export function date (input) {
  return { text: input, type: datatype.date }
}

export function text (input) {
  return { text: input, type: datatype.text }
}

export function value (input, type) {
  return { text: input, type: type || datatype.text }
}

export function equal (a, b) {
  if (a === b) return true
  if (a == null || b == null) return false

  return a.type === b.type && a.text === b.text
}
